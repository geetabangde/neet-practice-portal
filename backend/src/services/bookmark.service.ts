import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db";
import type { OptionKey, QuestionType } from "./question.service";
import { slugify } from "./student-content.service";
import type { PracticeQuestion } from "./student-practice.service";

// A student can bookmark a question to find it again. A question can be bookmarked (and shown) only while it is
// published and its topic, module and subject are all active.
const ACTIVE_CHAIN = `t.status = 'active' AND m.status = 'active' AND s.status = 'active'`;

// One row per student and question. Deleting a student or a question deletes its bookmarks.
export const CREATE_BOOKMARKS_TABLE = `
  CREATE TABLE IF NOT EXISTS student_bookmarks (
    student_id  INT UNSIGNED NOT NULL,
    question_id INT UNSIGNED NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, question_id),
    KEY idx_student_bookmarks_question (question_id),
    CONSTRAINT fk_student_bookmarks_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    CONSTRAINT fk_student_bookmarks_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

// The bookmarks page shows them grouped by module
export interface BookmarkGroup {
  moduleId: number;
  moduleName: string;
  subjectId: number;
  subjectName: string;
  subjectSlug: string;
  // How many bookmarked questions the module has
  count: number;
}

// Bookmarks the question for this student. Returns false when the question cannot be bookmarked
// (it does not exist, is not published, or has been switched off). Doing it twice is fine.
export async function addBookmark(studentId: number, questionId: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT q.id FROM questions q JOIN topics t ON t.id = q.topic_id JOIN modules m ON m.id = t.module_id JOIN subjects s ON s.id = t.subject_id
     WHERE q.id = ? AND q.status = 'published' AND ${ACTIVE_CHAIN}`,
    [questionId],
  );
  if (rows.length === 0) return false;
  await pool.query<ResultSetHeader>("INSERT IGNORE INTO student_bookmarks (student_id, question_id) VALUES (?, ?)", [studentId, questionId]);
  return true;
}

// Removing a bookmark that is not there is fine too
export async function removeBookmark(studentId: number, questionId: number): Promise<void> {
  await pool.query("DELETE FROM student_bookmarks WHERE student_id = ? AND question_id = ?", [studentId, questionId]);
}

// The student's bookmarks grouped by module, the module with the newest bookmark first
export async function listBookmarkGroups(studentId: number): Promise<BookmarkGroup[]> {
  const [rows] = await pool.query<(RowDataPacket & { moduleId: number; moduleName: string; subjectId: number; subjectName: string; total: number | string })[]>(
    `SELECT m.id AS moduleId, m.name AS moduleName, s.id AS subjectId, s.name AS subjectName, COUNT(*) AS total
     FROM student_bookmarks b
     JOIN questions q ON q.id = b.question_id
     JOIN topics t ON t.id = q.topic_id JOIN modules m ON m.id = t.module_id JOIN subjects s ON s.id = t.subject_id
     WHERE b.student_id = ? AND q.status = 'published' AND ${ACTIVE_CHAIN}
     GROUP BY m.id, m.name, s.id, s.name
     ORDER BY MAX(b.created_at) DESC, m.id DESC`,
    [studentId],
  );
  return rows.map((row) => ({
    moduleId: row.moduleId,
    moduleName: row.moduleName,
    subjectId: row.subjectId,
    subjectName: row.subjectName,
    subjectSlug: slugify(row.subjectName),
    count: Number(row.total),
  }));
}

// The student's bookmarked questions of one module (without the answers). null when the student has none there.
export async function listBookmarkedQuestions(
  studentId: number,
  moduleId: number,
): Promise<{ module: { id: number; name: string; subjectName: string; subjectSlug: string }; questions: PracticeQuestion[] } | null> {
  const [rows] = await pool.query<
    (RowDataPacket & { id: number; text: string; type: QuestionType; a: string; b: string; c: string; d: string; moduleName: string; subjectName: string })[]
  >(
    `SELECT q.id, q.question_text AS text, q.type, q.option_a AS a, q.option_b AS b, q.option_c AS c, q.option_d AS d,
       m.name AS moduleName, s.name AS subjectName
     FROM student_bookmarks b
     JOIN questions q ON q.id = b.question_id
     JOIN topics t ON t.id = q.topic_id JOIN modules m ON m.id = t.module_id JOIN subjects s ON s.id = t.subject_id
     WHERE b.student_id = ? AND m.id = ? AND q.status = 'published' AND ${ACTIVE_CHAIN}
     ORDER BY b.created_at DESC, q.id DESC`,
    [studentId, moduleId],
  );
  if (rows.length === 0) return null;
  return {
    module: { id: moduleId, name: rows[0].moduleName, subjectName: rows[0].subjectName, subjectSlug: slugify(rows[0].subjectName) },
    questions: rows.map((row) => ({
      id: row.id,
      text: row.text,
      type: row.type,
      options: { A: row.a, B: row.b, C: row.c, D: row.d } as Record<OptionKey, string>,
      // Everything in this list is bookmarked
      bookmarked: true,
    })),
  };
}
