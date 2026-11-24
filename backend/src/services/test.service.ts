import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../config/db";
import { CREATE_PAPER_TABLE, countPaperQuestions } from "./test-paper.service";
import { CREATE_SECTION_TABLE, countSections } from "./test-section.service";

export type TestStatus = "draft" | "published" | "completed";
export type TestKind = "grand" | "mini" | "subject";
export type TestPattern = "NEET" | "INICET";
// Marks taken off for a wrong answer, as a share of the marks of a right answer: a third or a quarter
export type NegativeRatio = "1/3" | "1/4";

export const NEGATIVE_RATIOS: readonly NegativeRatio[] = ["1/3", "1/4"];

const DIVISOR: Record<NegativeRatio, number> = { "1/3": 3, "1/4": 4 };

// Marks taken off for one wrong answer, to 2 decimals (4 marks: 1/3 -> 1.33, 1/4 -> 1)
export function negativeFor(marksPerQuestion: number, ratio: NegativeRatio): number {
  return Math.round((marksPerQuestion / DIVISOR[ratio]) * 100) / 100;
}

export interface MockTest {
  id: number;
  title: string;
  description: string;
  // Where the test shows in the student Test Series: Grand, Mini or Subject tests, in the NEET or INICET pattern
  kind: TestKind;
  pattern: TestPattern;
  // How many questions were written in this test (the questions themselves have their own routes)
  questionCount: number;
  // How many parts (Part A, Part B ...) the test is cut into. 0: no parts, one timer for the whole test.
  sectionCount: number;
  durationMinutes: number;
  marksPerQuestion: number;
  negativeRatio: NegativeRatio;
  // Marks removed for each wrong answer: worked out from marksPerQuestion and negativeRatio, never typed in
  negativeMarking: number;
  // YYYY-MM-DDTHH:mm, the same shape as <input type="datetime-local">. No time zone is stored:
  // it is the clock time the admin typed.
  startAt: string;
  endAt: string;
  status: TestStatus;
}

// What the admin writes. The question count and the negative marks are not written: they are worked out.
export type MockTestInput = Omit<MockTest, "id" | "questionCount" | "sectionCount" | "negativeMarking">;

interface TestRow extends RowDataPacket {
  id: number;
  title: string;
  description: string;
  kind: TestKind;
  pattern: TestPattern;
  durationMinutes: number;
  marksPerQuestion: string;
  negativeRatio: NegativeRatio;
  startAt: string;
  endAt: string;
  status: TestStatus;
}

const COLUMNS = `id, title, description, kind, pattern, duration_minutes AS durationMinutes, marks_per_question AS marksPerQuestion,
  negative_ratio AS negativeRatio, DATE_FORMAT(start_at, '%Y-%m-%dT%H:%i') AS startAt,
  DATE_FORMAT(end_at, '%Y-%m-%dT%H:%i') AS endAt, status`;

// The questions of a test live in their own table (test_series_questions) and are deleted with the test.
// negative_marking keeps the marks taken off for a wrong answer, filled in from negative_ratio.
export const CREATE_TEST_TABLES = [
  `CREATE TABLE IF NOT EXISTS tests (
    id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
    title              VARCHAR(200) NOT NULL,
    description        VARCHAR(1000) NOT NULL DEFAULT '',
    kind               ENUM('grand','mini','subject') NOT NULL DEFAULT 'grand',
    pattern            ENUM('NEET','INICET') NOT NULL DEFAULT 'NEET',
    duration_minutes   SMALLINT UNSIGNED NOT NULL,
    marks_per_question DECIMAL(6,2) NOT NULL,
    negative_ratio     ENUM('1/3','1/4') NOT NULL DEFAULT '1/3',
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
  CREATE_SECTION_TABLE,
  CREATE_PAPER_TABLE,
];

async function assemble(rows: TestRow[]): Promise<MockTest[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);
  const [counts, sections] = await Promise.all([countPaperQuestions(ids), countSections(ids)]);
  return rows.map((row) => {
    // DECIMAL columns come back from MySQL as text
    const marksPerQuestion = Number(row.marksPerQuestion);
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      kind: row.kind,
      pattern: row.pattern,
      questionCount: counts.get(row.id) ?? 0,
      sectionCount: sections.get(row.id) ?? 0,
      durationMinutes: row.durationMinutes,
      marksPerQuestion,
      negativeRatio: row.negativeRatio,
      negativeMarking: negativeFor(marksPerQuestion, row.negativeRatio),
      startAt: row.startAt,
      endAt: row.endAt,
      status: row.status,
    };
  });
}

function errno(error: unknown): number | null {
  return typeof error === "object" && error !== null && "errno" in error && typeof error.errno === "number" ? error.errno : null;
}

export async function listTests(): Promise<MockTest[]> {
  try {
    const [rows] = await pool.query<TestRow[]>(`SELECT ${COLUMNS} FROM tests ORDER BY id DESC`);
    return assemble(rows);
  } catch (error) {
    if (errno(error) === 1054) {
      await migrateNegativeRatio();
      const [rows] = await pool.query<TestRow[]>(`SELECT ${COLUMNS} FROM tests ORDER BY id DESC`);
      return assemble(rows);
    }
    throw error;
  }
}

export async function getTest(id: number): Promise<MockTest | null> {
  try {
    const [rows] = await pool.query<TestRow[]>(`SELECT ${COLUMNS} FROM tests WHERE id = ? LIMIT 1`, [id]);
    return (await assemble(rows))[0] ?? null;
  } catch (error) {
    if (errno(error) === 1054) {
      await migrateNegativeRatio();
      const [rows] = await pool.query<TestRow[]>(`SELECT ${COLUMNS} FROM tests WHERE id = ? LIMIT 1`, [id]);
      return (await assemble(rows))[0] ?? null;
    }
    throw error;
  }
}

// "2026-11-20T09:30" -> "2026-11-20 09:30:00", the form MySQL DATETIME takes
const toSqlDateTime = (value: string) => `${value.replace("T", " ")}:00`;

export async function createTest(input: MockTestInput): Promise<MockTest> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO tests (title, description, kind, pattern, duration_minutes, marks_per_question, negative_ratio, negative_marking, start_at, end_at, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.title,
      input.description,
      input.kind,
      input.pattern,
      input.durationMinutes,
      input.marksPerQuestion,
      input.negativeRatio,
      negativeFor(input.marksPerQuestion, input.negativeRatio),
      toSqlDateTime(input.startAt),
      toSqlDateTime(input.endAt),
      input.status,
    ],
  );
  const created = await getTest(result.insertId);
  if (!created) throw new Error("Test was inserted but could not be read back");
  return created;
}

// Writes a complete, already validated test. Returns false when no test has this id.
export async function replaceTest(id: number, input: MockTestInput): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE tests SET title = ?, description = ?, kind = ?, pattern = ?, duration_minutes = ?, marks_per_question = ?, negative_ratio = ?,
       negative_marking = ?, start_at = ?, end_at = ?, status = ? WHERE id = ?`,
    [
      input.title,
      input.description,
      input.kind,
      input.pattern,
      input.durationMinutes,
      input.marksPerQuestion,
      input.negativeRatio,
      negativeFor(input.marksPerQuestion, input.negativeRatio),
      toSqlDateTime(input.startAt),
      toSqlDateTime(input.endAt),
      input.status,
      id,
    ],
  );
  return result.affectedRows === 1;
}

export async function deleteTest(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>("DELETE FROM tests WHERE id = ?", [id]);
  return result.affectedRows === 1;
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

// An older database typed the negative marks in as a number. Now the admin picks a third or a quarter of the marks, so this adds
// the column and picks the closer of the two for each old test (4 marks and -1 becomes 1/4). Then every test's negative_marking
// is filled in from its ratio.
export async function migrateNegativeRatio(): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tests' AND COLUMN_NAME = 'negative_ratio'",
  );
  if (rows.length > 0) return false;
  await pool.query("ALTER TABLE tests ADD COLUMN negative_ratio ENUM('1/3','1/4') NOT NULL DEFAULT '1/3' AFTER marks_per_question");
  await pool.query(
    "UPDATE tests SET negative_ratio = IF(ABS(negative_marking - marks_per_question / 3) < ABS(negative_marking - marks_per_question / 4), '1/3', '1/4')",
  );
  await pool.query("UPDATE tests SET negative_marking = ROUND(marks_per_question / IF(negative_ratio = '1/3', 3, 4), 2)");
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
            (SELECT COUNT(*) FROM test_series_questions q WHERE q.test_id = t.id) AS questionCount
       FROM tests t WHERE t.status IN ('published', 'completed')
      HAVING questionCount > 0 ORDER BY t.start_at ASC, t.id ASC`,
  );
  return rows.map((row) => ({ ...row, questionCount: Number(row.questionCount) }));
}
