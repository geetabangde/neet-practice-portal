import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../config/db";
import { OPTION_KEYS, type OptionKey, type QuestionType } from "./question.service";

// The questions of the Test Series. They belong to ONE test and are written inside it: they have nothing to do with the
// QBank questions (no subject, module or topic). Deleting a test deletes its questions.
export const CREATE_PAPER_TABLE = `CREATE TABLE IF NOT EXISTS test_series_questions (
    id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
    test_id        INT UNSIGNED NOT NULL,
    position       SMALLINT UNSIGNED NOT NULL,
    question_text  TEXT NOT NULL,
    type           ENUM('single','multiple') NOT NULL DEFAULT 'single',
    option_a       TEXT NOT NULL,
    option_b       TEXT NOT NULL,
    option_c       TEXT NOT NULL,
    option_d       TEXT NOT NULL,
    correct        VARCHAR(7) NOT NULL DEFAULT '',
    explanation    TEXT NOT NULL,
    reference_text VARCHAR(255) NOT NULL DEFAULT '',
    image_name     VARCHAR(255) NOT NULL DEFAULT '',
    image_token    CHAR(32) NULL,
    section_id     INT UNSIGNED NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_test_series_questions_order (test_id, position),
    KEY idx_test_series_questions_section (section_id),
    CONSTRAINT fk_test_series_questions_test FOREIGN KEY (test_id) REFERENCES tests (id) ON DELETE CASCADE,
    CONSTRAINT fk_test_series_questions_section FOREIGN KEY (section_id) REFERENCES test_sections (id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

export interface PaperQuestionInput {
  text: string;
  type: QuestionType;
  options: Record<OptionKey, string>;
  correct: OptionKey[];
  explanation: string;
  reference: string;
  // The name of the file the admin chose, and the token of the saved picture (shown at /api/images/<token>)
  imageName: string;
  imageToken: string | null;
  // The part (section) of the test the question is in, or null when the test has no parts
  sectionId: number | null;
}

export interface PaperQuestion extends PaperQuestionInput {
  id: number;
  testId: number;
  // 1, 2, 3 ... the order in the test
  position: number;
}

interface PaperRow extends RowDataPacket {
  id: number;
  testId: number;
  position: number;
  text: string;
  type: QuestionType;
  a: string;
  b: string;
  c: string;
  d: string;
  correct: string;
  explanation: string;
  reference: string;
  imageName: string;
  imageToken: string | null;
  sectionId: number | null;
}

const COLUMNS = `q.id, q.test_id AS testId, q.position, q.question_text AS text, q.type, q.option_a AS a, q.option_b AS b, q.option_c AS c, q.option_d AS d,
  q.correct, q.explanation, q.reference_text AS reference, q.image_name AS imageName, q.image_token AS imageToken, q.section_id AS sectionId`;

const letters = (text: string): OptionKey[] => (text === "" ? [] : (text.split(",") as OptionKey[]));

function toQuestion(row: PaperRow): PaperQuestion {
  return {
    id: row.id,
    testId: row.testId,
    position: row.position,
    text: row.text,
    type: row.type,
    options: { A: row.a, B: row.b, C: row.c, D: row.d },
    correct: letters(row.correct),
    explanation: row.explanation,
    reference: row.reference,
    imageName: row.imageName,
    imageToken: row.imageToken,
    sectionId: row.sectionId,
  };
}

export async function listPaperQuestions(testId: number): Promise<PaperQuestion[]> {
  try {
    const [rows] = await pool.query<PaperRow[]>(`SELECT ${COLUMNS} FROM test_series_questions q LEFT JOIN test_sections s ON s.id = q.section_id
        WHERE q.test_id = ? ORDER BY COALESCE(s.position, 0) ASC, q.position ASC, q.id ASC`, [testId]);
    return rows.map(toQuestion);
  } catch (error) {
    if (typeof error === "object" && error !== null && "errno" in error && error.errno === 1146) {
      await pool.query(CREATE_PAPER_TABLE);
      return [];
    }
    throw error;
  }
}

export async function testExists(testId: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT 1 FROM tests WHERE id = ? LIMIT 1", [testId]);
  return rows.length > 0;
}

// Once a student has started the test its questions are fixed: changing or removing one would change marks already given
export async function hasAttempts(testId: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT 1 FROM test_attempts WHERE test_id = ? LIMIT 1", [testId]);
  return rows.length > 0;
}

async function inTransaction<T>(work: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

const valuesOf = (testId: number, position: number, q: PaperQuestionInput) => [
  testId,
  position,
  q.text,
  q.type,
  q.options.A,
  q.options.B,
  q.options.C,
  q.options.D,
  [...q.correct].sort().join(","),
  q.explanation,
  q.reference,
  q.imageName,
  q.imageToken,
  q.sectionId,
];

const INSERT = `INSERT INTO test_series_questions (test_id, position, question_text, type, option_a, option_b, option_c, option_d, correct, explanation, reference_text, image_name, image_token, section_id) VALUES ?`;

// Adds the questions at the end of the test, in the order given. Returns how many were added.
export async function addPaperQuestions(testId: number, questions: PaperQuestionInput[]): Promise<number> {
  if (questions.length === 0) return 0;
  return inTransaction(async (connection) => {
    const [rows] = await connection.query<(RowDataPacket & { last: number | null })[]>("SELECT MAX(position) AS last FROM test_series_questions WHERE test_id = ?", [testId]);
    const first = Number(rows[0]?.last ?? 0) + 1;
    await connection.query(INSERT, [questions.map((q, index) => valuesOf(testId, first + index, q))]);
    return questions.length;
  });
}

// Writes the whole question again. Returns false when this test has no such question.
export async function replacePaperQuestion(testId: number, questionId: number, q: PaperQuestionInput): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE test_series_questions SET question_text = ?, type = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct = ?,
       explanation = ?, reference_text = ?, image_name = ?, image_token = ?, section_id = ? WHERE id = ? AND test_id = ?`,
    [q.text, q.type, q.options.A, q.options.B, q.options.C, q.options.D, [...q.correct].sort().join(","), q.explanation, q.reference, q.imageName, q.imageToken, q.sectionId, questionId, testId],
  );
  return result.affectedRows === 1;
}

// Removes the question and closes the gap in the numbering
export async function deletePaperQuestion(testId: number, questionId: number): Promise<boolean> {
  return inTransaction(async (connection) => {
    const [result] = await connection.query<ResultSetHeader>("DELETE FROM test_series_questions WHERE id = ? AND test_id = ?", [questionId, testId]);
    if (result.affectedRows === 0) return false;
    const [rows] = await connection.query<(RowDataPacket & { id: number })[]>("SELECT id FROM test_series_questions WHERE test_id = ? ORDER BY position ASC, id ASC", [testId]);
    for (const [index, row] of rows.entries()) await connection.query("UPDATE test_series_questions SET position = ? WHERE id = ?", [index + 1, row.id]);
    return true;
  });
}

// Puts the questions in the given order. The list must hold exactly the questions of the test. Returns false when it does not.
export async function reorderPaperQuestions(testId: number, ids: number[]): Promise<boolean> {
  return inTransaction(async (connection) => {
    const [rows] = await connection.query<(RowDataPacket & { id: number })[]>("SELECT id FROM test_series_questions WHERE test_id = ?", [testId]);
    const have = new Set(rows.map((row) => row.id));
    // Same size, every id in the test, and no id twice
    if (ids.length !== have.size || new Set(ids).size !== ids.length || !ids.every((id) => have.has(id))) return false;
    for (const [index, id] of ids.entries()) await connection.query("UPDATE test_series_questions SET position = ? WHERE id = ?", [index + 1, id]);
    return true;
  });
}

// How many questions each test has: Map(testId -> number)
export async function countPaperQuestions(testIds: number[]): Promise<Map<number, number>> {
  if (testIds.length === 0) return new Map();
  try {
    const [rows] = await pool.query<(RowDataPacket & { testId: number; total: number })[]>(
      "SELECT test_id AS testId, COUNT(*) AS total FROM test_series_questions WHERE test_id IN (?) GROUP BY test_id",
      [testIds],
    );
    return new Map(rows.map((row) => [row.testId, Number(row.total)]));
  } catch (error) {
    if (typeof error === "object" && error !== null && "errno" in error && error.errno === 1146) {
      await pool.query(CREATE_PAPER_TABLE);
      return new Map();
    }
    throw error;
  }
}

export const OPTION_LIST = OPTION_KEYS;

// Older databases made a test out of QBank questions (table test_questions). This gives every test its own copy of those
// questions (same order), moves the students' saved answers to the copies, and points the answers at the new table.
// Safe to run again: a test that already has its own questions is not copied twice, and it does nothing once the answers
// point at test_series_questions. The old table is left in place, unused.
export async function migrateTestQuestions(): Promise<{ copied: number } | null> {
  const [fks] = await pool.query<(RowDataPacket & { ref: string })[]>(
    `SELECT REFERENCED_TABLE_NAME AS ref FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'test_attempt_answers' AND CONSTRAINT_NAME = 'fk_attempt_answers_question'`,
  );
  if (fks[0]?.ref === "test_series_questions") return null;

  const [answersTable] = await pool.query<RowDataPacket[]>("SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'test_attempt_answers'");
  if (answersTable.length === 0) return null;

  const [legacy] = await pool.query<RowDataPacket[]>("SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'test_questions'");
  let copied = 0;

  // The answers still point at QBank questions only while the foreign key to the QBank table is there
  const answersStillOld = fks.length > 0;

  if (answersStillOld && legacy.length > 0) {
    // 1. Copy the questions of every test that has no questions of its own yet, keeping the order (position)
    const [copiedRows] = await pool.query<ResultSetHeader>(
      `INSERT INTO test_series_questions (test_id, position, question_text, type, option_a, option_b, option_c, option_d, correct, explanation, reference_text)
        SELECT tq.test_id, tq.position, q.question_text, q.type, q.option_a, q.option_b, q.option_c, q.option_d, q.correct, q.explanation, q.reference_text
          FROM test_questions tq JOIN questions q ON q.id = tq.question_id
         WHERE NOT EXISTS (SELECT 1 FROM test_series_questions n WHERE n.test_id = tq.test_id)
         ORDER BY tq.test_id, tq.position`,
    );
    copied = copiedRows.affectedRows;
  }

  if (answersStillOld) {
    // 2. Drop the foreign key so an answer can hold the id of a copy
    await pool.query("ALTER TABLE test_attempt_answers DROP FOREIGN KEY fk_attempt_answers_question");
    // 3. Each answer moves to the copy that has the same test and the same position as the question it answered.
    //    First every id is lifted far above any real id, so that a new id can never meet an old id of the same attempt
    //    (the pair attempt + question is unique); then each one is set to its copy.
    if (legacy.length > 0) {
      await pool.query("UPDATE test_attempt_answers SET question_id = question_id + 2000000000");
      await pool.query(
        `UPDATE test_attempt_answers aa
           JOIN test_attempts a ON a.id = aa.attempt_id
           JOIN test_questions tq ON tq.test_id = a.test_id AND tq.question_id = CAST(aa.question_id AS SIGNED) - 2000000000
           JOIN test_series_questions nq ON nq.test_id = a.test_id AND nq.position = tq.position
            SET aa.question_id = nq.id`,
      );
    }
  }

  // 4. An answer to a question that is not in its test has nothing to point at
  await pool.query("DELETE aa FROM test_attempt_answers aa LEFT JOIN test_series_questions q ON q.id = aa.question_id WHERE q.id IS NULL");
  // 5. Point the answers at the new table
  await pool.query(
    "ALTER TABLE test_attempt_answers ADD CONSTRAINT fk_attempt_answers_question FOREIGN KEY (question_id) REFERENCES test_series_questions (id) ON DELETE CASCADE",
  );
  return { copied };
}

// An older database has test questions without the image columns: this adds them. Safe to run again.
export async function migrateTestQuestionImage(): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'test_series_questions' AND COLUMN_NAME = 'image_token'",
  );
  if (rows.length > 0) return false;
  await pool.query("ALTER TABLE test_series_questions ADD COLUMN image_name VARCHAR(255) NOT NULL DEFAULT '' AFTER reference_text, ADD COLUMN image_token CHAR(32) NULL AFTER image_name");
  return true;
}
