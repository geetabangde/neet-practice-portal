import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../config/db";

export type TestStatus = "draft" | "published" | "completed";
export type TestKind = "grand" | "mini" | "subject";
export type TestPattern = "NEET" | "INICET";

export interface MockTest {
  id: number;
  title: string;
  description: string;
  // Where the test shows in the student Test Series: Grand, Mini or Subject tests, in the NEET or INICET pattern
  kind: TestKind;
  pattern: TestPattern;
  subjectIds: number[];
  topicIds: number[];
  questionIds: number[];
  durationMinutes: number;
  marksPerQuestion: number;
  // Marks removed for each wrong answer
  negativeMarking: number;
  // YYYY-MM-DDTHH:mm, the same shape as <input type="datetime-local">. No time zone is stored:
  // it is the clock time the admin typed.
  startAt: string;
  endAt: string;
  status: TestStatus;
}

export type MockTestInput = Omit<MockTest, "id">;

interface TestRow extends RowDataPacket {
  id: number;
  title: string;
  description: string;
  kind: TestKind;
  pattern: TestPattern;
  durationMinutes: number;
  marksPerQuestion: string;
  negativeMarking: string;
  startAt: string;
  endAt: string;
  status: TestStatus;
}

interface LinkRow extends RowDataPacket {
  testId: number;
  itemId: number;
}

const COLUMNS = `id, title, description, kind, pattern, duration_minutes AS durationMinutes, marks_per_question AS marksPerQuestion,
  negative_marking AS negativeMarking, DATE_FORMAT(start_at, '%Y-%m-%dT%H:%i') AS startAt,
  DATE_FORMAT(end_at, '%Y-%m-%dT%H:%i') AS endAt, status`;

// A test has three lists attached to it, each in its own link table. When a test, subject, topic
// or question is deleted, the matching links go with it (ON DELETE CASCADE).
export const CREATE_TEST_TABLES = [
  `CREATE TABLE IF NOT EXISTS tests (
    id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
    title              VARCHAR(200) NOT NULL,
    description        VARCHAR(1000) NOT NULL DEFAULT '',
    kind               ENUM('grand','mini','subject') NOT NULL DEFAULT 'grand',
    pattern            ENUM('NEET','INICET') NOT NULL DEFAULT 'NEET',
    duration_minutes   SMALLINT UNSIGNED NOT NULL,
    marks_per_question DECIMAL(6,2) NOT NULL,
    negative_marking   DECIMAL(6,2) NOT NULL DEFAULT 0,
    start_at           DATETIME NOT NULL,
    end_at             DATETIME NOT NULL,
    status             ENUM('draft','published','completed') NOT NULL DEFAULT 'draft',
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_tests_status (status),
    KEY idx_tests_start (start_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS test_subjects (
    test_id    INT UNSIGNED NOT NULL,
    subject_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (test_id, subject_id),
    CONSTRAINT fk_test_subjects_test FOREIGN KEY (test_id) REFERENCES tests (id) ON DELETE CASCADE,
    CONSTRAINT fk_test_subjects_subject FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS test_topics (
    test_id  INT UNSIGNED NOT NULL,
    topic_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (test_id, topic_id),
    CONSTRAINT fk_test_topics_test FOREIGN KEY (test_id) REFERENCES tests (id) ON DELETE CASCADE,
    CONSTRAINT fk_test_topics_topic FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  // position keeps the order in which the admin picked the questions
  `CREATE TABLE IF NOT EXISTS test_questions (
    test_id     INT UNSIGNED NOT NULL,
    question_id INT UNSIGNED NOT NULL,
    position    SMALLINT UNSIGNED NOT NULL,
    PRIMARY KEY (test_id, question_id),
    KEY idx_test_questions_order (test_id, position),
    CONSTRAINT fk_test_questions_test FOREIGN KEY (test_id) REFERENCES tests (id) ON DELETE CASCADE,
    CONSTRAINT fk_test_questions_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

// 1452 = a subject, topic or question id in the lists does not exist
export function isMissingReference(error: unknown): boolean {
  return typeof error === "object" && error !== null && "errno" in error && error.errno === 1452;
}

// Ids of every link table, grouped by test: Map(testId -> [id, id, ...])
async function loadLinks(table: string, column: string, orderBy: string, testIds?: number[]): Promise<Map<number, number[]>> {
  const where = testIds ? "WHERE test_id IN (?)" : "";
  const [rows] = await pool.query<LinkRow[]>(
    `SELECT test_id AS testId, ${column} AS itemId FROM ${table} ${where} ORDER BY ${orderBy}`,
    testIds ? [testIds] : [],
  );
  const grouped = new Map<number, number[]>();
  for (const row of rows) grouped.set(row.testId, [...(grouped.get(row.testId) ?? []), row.itemId]);
  return grouped;
}

async function assemble(rows: TestRow[]): Promise<MockTest[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);
  const [subjects, topics, questions] = await Promise.all([
    loadLinks("test_subjects", "subject_id", "subject_id", ids),
    loadLinks("test_topics", "topic_id", "topic_id", ids),
    loadLinks("test_questions", "question_id", "position", ids),
  ]);
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    kind: row.kind,
    pattern: row.pattern,
    subjectIds: subjects.get(row.id) ?? [],
    topicIds: topics.get(row.id) ?? [],
    questionIds: questions.get(row.id) ?? [],
    durationMinutes: row.durationMinutes,
    // DECIMAL columns come back from MySQL as text
    marksPerQuestion: Number(row.marksPerQuestion),
    negativeMarking: Number(row.negativeMarking),
    startAt: row.startAt,
    endAt: row.endAt,
    status: row.status,
  }));
}

export async function listTests(): Promise<MockTest[]> {
  const [rows] = await pool.query<TestRow[]>(`SELECT ${COLUMNS} FROM tests ORDER BY id DESC`);
  return assemble(rows);
}

export async function getTest(id: number): Promise<MockTest | null> {
  const [rows] = await pool.query<TestRow[]>(`SELECT ${COLUMNS} FROM tests WHERE id = ? LIMIT 1`, [id]);
  return (await assemble(rows))[0] ?? null;
}

// "2026-11-20T09:30" -> "2026-11-20 09:30:00", the form MySQL DATETIME takes
const toSqlDateTime = (value: string) => `${value.replace("T", " ")}:00`;

async function writeLinks(connection: PoolConnection, testId: number, input: MockTestInput): Promise<void> {
  // One INSERT per table: "VALUES ?" expands a list of rows
  if (input.subjectIds.length > 0) {
    await connection.query("INSERT INTO test_subjects (test_id, subject_id) VALUES ?", [input.subjectIds.map((id) => [testId, id])]);
  }
  if (input.topicIds.length > 0) {
    await connection.query("INSERT INTO test_topics (test_id, topic_id) VALUES ?", [input.topicIds.map((id) => [testId, id])]);
  }
  if (input.questionIds.length > 0) {
    await connection.query("INSERT INTO test_questions (test_id, question_id, position) VALUES ?", [
      input.questionIds.map((id, index) => [testId, id, index + 1]),
    ]);
  }
}

// Runs the steps as one unit: if any of them fails, none of them is kept
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

export async function createTest(input: MockTestInput): Promise<MockTest> {
  const id = await inTransaction(async (connection) => {
    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO tests (title, description, kind, pattern, duration_minutes, marks_per_question, negative_marking, start_at, end_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.title,
        input.description,
        input.kind,
        input.pattern,
        input.durationMinutes,
        input.marksPerQuestion,
        input.negativeMarking,
        toSqlDateTime(input.startAt),
        toSqlDateTime(input.endAt),
        input.status,
      ],
    );
    await writeLinks(connection, result.insertId, input);
    return result.insertId;
  });
  const created = await getTest(id);
  if (!created) throw new Error("Test was inserted but could not be read back");
  return created;
}

// Writes a complete, already validated test. Returns false when no test has this id.
export async function replaceTest(id: number, input: MockTestInput): Promise<boolean> {
  return inTransaction(async (connection) => {
    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE tests SET title = ?, description = ?, kind = ?, pattern = ?, duration_minutes = ?, marks_per_question = ?, negative_marking = ?,
         start_at = ?, end_at = ?, status = ? WHERE id = ?`,
      [
        input.title,
        input.description,
        input.kind,
        input.pattern,
        input.durationMinutes,
        input.marksPerQuestion,
        input.negativeMarking,
        toSqlDateTime(input.startAt),
        toSqlDateTime(input.endAt),
        input.status,
        id,
      ],
    );
    if (result.affectedRows === 0) return false;
    // The simplest correct update of the three lists: clear them and write them again
    await connection.query("DELETE FROM test_subjects WHERE test_id = ?", [id]);
    await connection.query("DELETE FROM test_topics WHERE test_id = ?", [id]);
    await connection.query("DELETE FROM test_questions WHERE test_id = ?", [id]);
    await writeLinks(connection, id, input);
    return true;
  });
}

export async function deleteTest(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>("DELETE FROM tests WHERE id = ?", [id]);
  return result.affectedRows === 1;
}

// The subjects and topics of a set of questions, and how many of the questions exist. A test does not choose its
// subjects and topics: they are whatever its questions belong to (a draft question without a topic adds none).
export async function scopeOfQuestions(questionIds: number[]): Promise<{ found: number; subjectIds: number[]; topicIds: number[] }> {
  if (questionIds.length === 0) return { found: 0, subjectIds: [], topicIds: [] };
  const [rows] = await pool.query<(RowDataPacket & { id: number; subjectId: number | null; topicId: number | null })[]>(
    "SELECT id, subject_id AS subjectId, topic_id AS topicId FROM questions WHERE id IN (?)",
    [questionIds],
  );
  const subjects = new Set<number>();
  const topics = new Set<number>();
  for (const row of rows) {
    if (row.subjectId !== null) subjects.add(row.subjectId);
    if (row.topicId !== null) topics.add(row.topicId);
  }
  return { found: rows.length, subjectIds: [...subjects].sort((a, b) => a - b), topicIds: [...topics].sort((a, b) => a - b) };
}

// How many of these questions are published
export async function countPublishedQuestions(questionIds: number[]): Promise<number> {
  if (questionIds.length === 0) return 0;
  const [rows] = await pool.query<(RowDataPacket & { total: number })[]>(
    "SELECT COUNT(*) AS total FROM questions WHERE id IN (?) AND status = 'published'",
    [questionIds],
  );
  return Number(rows[0]?.total ?? 0);
}

// An older database has tests without kind and pattern: this adds the two columns (every old test becomes a Grand test, NEET pattern)
export async function migrateTestKind(): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tests' AND COLUMN_NAME = 'kind'",
  );
  if (rows.length > 0) return false;
  await pool.query("ALTER TABLE tests ADD COLUMN kind ENUM('grand','mini','subject') NOT NULL DEFAULT 'grand' AFTER description");
  await pool.query("ALTER TABLE tests ADD COLUMN pattern ENUM('NEET','INICET') NOT NULL DEFAULT 'NEET' AFTER kind");
  return true;
}

// What a student sees in the Test Series
export interface StudentTest {
  id: number;
  title: string;
  kind: TestKind;
  pattern: TestPattern;
  // YYYY-MM-DDTHH:mm
  startAt: string;
  endAt: string;
  questionCount: number;
  durationMinutes: number;
  status: "published" | "completed";
}

// Published and completed tests that have questions. Drafts are never shown to students.
export async function listStudentTests(): Promise<StudentTest[]> {
  const [rows] = await pool.query<(RowDataPacket & StudentTest)[]>(
    `SELECT t.id, t.title, t.kind, t.pattern, DATE_FORMAT(t.start_at, '%Y-%m-%dT%H:%i') AS startAt,
            DATE_FORMAT(t.end_at, '%Y-%m-%dT%H:%i') AS endAt, t.duration_minutes AS durationMinutes, t.status,
            (SELECT COUNT(*) FROM test_questions q WHERE q.test_id = t.id) AS questionCount
       FROM tests t WHERE t.status IN ('published', 'completed')
      HAVING questionCount > 0 ORDER BY t.start_at ASC, t.id ASC`,
  );
  return rows.map((row) => ({ ...row, questionCount: Number(row.questionCount) }));
}
