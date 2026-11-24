import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../config/db";

// A test can be cut into parts (Part A, Part B ...), each with its own timer. A student in Part A cannot go to Part B until
// the timer of Part A runs out (see test-attempt.service.ts). A test with no parts is one block with the one timer of the test.
// When a test has parts, its duration is the total of the parts.
export const CREATE_SECTION_TABLE = `CREATE TABLE IF NOT EXISTS test_sections (
    id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
    test_id          INT UNSIGNED NOT NULL,
    position         SMALLINT UNSIGNED NOT NULL,
    name             VARCHAR(60) NOT NULL,
    duration_minutes SMALLINT UNSIGNED NOT NULL,
    instructions     VARCHAR(1000) NOT NULL DEFAULT '',
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_test_sections_order (test_id, position),
    CONSTRAINT fk_test_sections_test FOREIGN KEY (test_id) REFERENCES tests (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

export const MAX_SECTIONS = 10;
// One test cannot run longer than a day
export const MAX_TOTAL_MINUTES = 1440;

export interface TestSection {
  id: number;
  testId: number;
  // 1, 2, 3 ... the order of the parts
  position: number;
  name: string;
  durationMinutes: number;
  instructions: string;
  questionCount: number;
}

export interface SectionInput {
  // Empty: the part is called "Part A", "Part B" ... by its place
  name: string;
  durationMinutes: number;
  instructions: string;
}

interface SectionRow extends RowDataPacket {
  id: number;
  testId: number;
  position: number;
  name: string;
  durationMinutes: number;
  instructions: string;
  questionCount: number;
}

const partName = (position: number) => `Part ${String.fromCharCode(64 + position)}`;

export async function listSections(testId: number): Promise<TestSection[]> {
  const [rows] = await pool.query<SectionRow[]>(
    `SELECT s.id, s.test_id AS testId, s.position, s.name, s.duration_minutes AS durationMinutes, s.instructions,
            (SELECT COUNT(*) FROM test_series_questions q WHERE q.section_id = s.id) AS questionCount
       FROM test_sections s WHERE s.test_id = ? ORDER BY s.position ASC, s.id ASC`,
    [testId],
  );
  return rows.map((row) => ({ ...row, questionCount: Number(row.questionCount) }));
}

// How many parts each test has: Map(testId -> number)
export async function countSections(testIds: number[]): Promise<Map<number, number>> {
  if (testIds.length === 0) return new Map();
  const [rows] = await pool.query<(RowDataPacket & { testId: number; total: number })[]>(
    "SELECT test_id AS testId, COUNT(*) AS total FROM test_sections WHERE test_id IN (?) GROUP BY test_id",
    [testIds],
  );
  return new Map(rows.map((row) => [row.testId, Number(row.total)]));
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

// The test lasts as long as its parts together
async function syncDuration(connection: PoolConnection, testId: number): Promise<void> {
  await connection.query(
    `UPDATE tests SET duration_minutes = (SELECT SUM(duration_minutes) FROM test_sections WHERE test_id = ?)
      WHERE id = ? AND EXISTS (SELECT 1 FROM test_sections WHERE test_id = ?)`,
    [testId, testId, testId],
  );
}

export type SectionOutcome = { ok: true } | { ok: false; status: number; message: string };

async function minutesOf(connection: PoolConnection, testId: number, exceptId: number | null): Promise<number> {
  const [rows] = await connection.query<(RowDataPacket & { total: number | null })[]>(
    "SELECT SUM(duration_minutes) AS total FROM test_sections WHERE test_id = ? AND id <> ?",
    [testId, exceptId ?? 0],
  );
  return Number(rows[0]?.total ?? 0);
}

export async function createSection(testId: number, input: SectionInput): Promise<SectionOutcome> {
  return inTransaction(async (connection): Promise<SectionOutcome> => {
    const [rows] = await connection.query<(RowDataPacket & { total: number; last: number | null })[]>(
      "SELECT COUNT(*) AS total, MAX(position) AS last FROM test_sections WHERE test_id = ?",
      [testId],
    );
    const count = Number(rows[0].total);
    if (count >= MAX_SECTIONS) return { ok: false, status: 409, message: `A test can have at most ${MAX_SECTIONS} parts.` };
    if ((await minutesOf(connection, testId, null)) + input.durationMinutes > MAX_TOTAL_MINUTES) {
      return { ok: false, status: 400, message: `The parts of a test can last ${MAX_TOTAL_MINUTES} minutes (24 hours) in all.` };
    }
    const position = Number(rows[0].last ?? 0) + 1;
    const [result] = await connection.query<ResultSetHeader>(
      "INSERT INTO test_sections (test_id, position, name, duration_minutes, instructions) VALUES (?, ?, ?, ?, ?)",
      [testId, position, input.name || partName(position), input.durationMinutes, input.instructions],
    );
    // The first part takes the questions the test already had
    if (count === 0) await connection.query("UPDATE test_series_questions SET section_id = ? WHERE test_id = ? AND section_id IS NULL", [result.insertId, testId]);
    await syncDuration(connection, testId);
    return { ok: true };
  });
}

export async function updateSection(testId: number, sectionId: number, input: SectionInput): Promise<SectionOutcome> {
  return inTransaction(async (connection): Promise<SectionOutcome> => {
    const [found] = await connection.query<(RowDataPacket & { position: number })[]>("SELECT position FROM test_sections WHERE id = ? AND test_id = ?", [sectionId, testId]);
    if (found.length === 0) return { ok: false, status: 404, message: "Part not found in this test" };
    if ((await minutesOf(connection, testId, sectionId)) + input.durationMinutes > MAX_TOTAL_MINUTES) {
      return { ok: false, status: 400, message: `The parts of a test can last ${MAX_TOTAL_MINUTES} minutes (24 hours) in all.` };
    }
    await connection.query("UPDATE test_sections SET name = ?, duration_minutes = ?, instructions = ? WHERE id = ?", [
      input.name || partName(found[0].position),
      input.durationMinutes,
      input.instructions,
      sectionId,
    ]);
    await syncDuration(connection, testId);
    return { ok: true };
  });
}

// Deleting a part does not delete its questions: they move to the part before it (or the one after, for the first part).
// When it was the only part, the test has no parts any more and its questions belong to the test alone.
export async function deleteSection(testId: number, sectionId: number): Promise<SectionOutcome> {
  return inTransaction(async (connection): Promise<SectionOutcome> => {
    const [all] = await connection.query<(RowDataPacket & { id: number })[]>("SELECT id FROM test_sections WHERE test_id = ? ORDER BY position ASC, id ASC", [testId]);
    const index = all.findIndex((row) => row.id === sectionId);
    if (index === -1) return { ok: false, status: 404, message: "Part not found in this test" };
    const target = all[index - 1] ?? all[index + 1] ?? null;
    await connection.query("UPDATE test_series_questions SET section_id = ? WHERE section_id = ?", [target ? target.id : null, sectionId]);
    await connection.query("DELETE FROM test_sections WHERE id = ?", [sectionId]);
    const left = all.filter((row) => row.id !== sectionId);
    for (const [i, row] of left.entries()) await connection.query("UPDATE test_sections SET position = ? WHERE id = ?", [i + 1, row.id]);
    await syncDuration(connection, testId);
    return { ok: true };
  });
}

// Puts the parts in the given order. The list must hold exactly the parts of the test.
export async function reorderSections(testId: number, ids: number[]): Promise<boolean> {
  return inTransaction(async (connection) => {
    const [rows] = await connection.query<(RowDataPacket & { id: number })[]>("SELECT id FROM test_sections WHERE test_id = ?", [testId]);
    const have = new Set(rows.map((row) => row.id));
    if (ids.length !== have.size || new Set(ids).size !== ids.length || !ids.every((id) => have.has(id))) return false;
    for (const [index, id] of ids.entries()) await connection.query("UPDATE test_sections SET position = ? WHERE id = ?", [index + 1, id]);
    return true;
  });
}

// An older database has test questions without section_id: this adds the column (a question with no part belongs to a test with no parts)
export async function migrateTestSections(): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'test_series_questions' AND COLUMN_NAME = 'section_id'",
  );
  if (rows.length > 0) return false;
  await pool.query(
    `ALTER TABLE test_series_questions
       ADD COLUMN section_id INT UNSIGNED NULL AFTER image_token,
       ADD KEY idx_test_series_questions_section (section_id),
       ADD CONSTRAINT fk_test_series_questions_section FOREIGN KEY (section_id) REFERENCES test_sections (id) ON DELETE SET NULL`,
  );
  return true;
}
