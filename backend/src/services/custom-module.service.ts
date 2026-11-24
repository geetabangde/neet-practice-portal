import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../config/db";
import type { Difficulty, OptionKey, QuestionType } from "./question.service";
import { slugify } from "./student-content.service";
import type { PracticeQuestion } from "./student-practice.service";

// A custom module is a set of questions a student asks for ("20 hard questions from these modules that I have
// not solved yet"). It is picked once, at random, and saved, so the student can come back to the same questions.

export const MAX_QUESTIONS = 200;
// Older custom modules of a student are cleaned away after this many
const KEEP_PER_STUDENT = 50;

// A question can be picked only while its topic, the module of the topic and the subject are all active
const ACTIVE_CHAIN = `t.status = 'active' AND m.status = 'active' AND s.status = 'active'`;

export const CREATE_CUSTOM_MODULE_TABLES = [
  `CREATE TABLE IF NOT EXISTS custom_modules (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id INT UNSIGNED NOT NULL,
    title      VARCHAR(150) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_custom_modules_student (student_id, id),
    CONSTRAINT fk_custom_modules_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  // position keeps the order in which the questions are solved
  `CREATE TABLE IF NOT EXISTS custom_module_questions (
    module_id   INT UNSIGNED NOT NULL,
    question_id INT UNSIGNED NOT NULL,
    position    SMALLINT UNSIGNED NOT NULL,
    PRIMARY KEY (module_id, question_id),
    KEY idx_custom_module_questions_order (module_id, position),
    CONSTRAINT fk_custom_module_questions_module FOREIGN KEY (module_id) REFERENCES custom_modules (id) ON DELETE CASCADE,
    CONSTRAINT fk_custom_module_questions_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

export interface CustomModuleRequest {
  count: number;
  difficulty: Difficulty;
  source: "all" | "qbank" | "bookmarked";
  // For source "qbank": which of the student's own questions to use
  qbank: { attempted: boolean; incorrect: boolean; unattempted: boolean };
  moduleIds: number[];
}

export interface CustomModuleSummary {
  id: number;
  title: string;
  // How many questions the module got
  questionCount: number;
  // How many questions matched the choices (it can be fewer than asked for)
  matching: number;
}

export interface PickerSubject {
  id: number;
  name: string;
  slug: string;
  modules: { id: number; name: string; questionCount: number }[];
}

// ---- What the student can choose from ----------------------------------------------------------

// Active subjects with their active modules and how many published questions each module has
export async function listPickerSubjects(): Promise<PickerSubject[]> {
  const [rows] = await pool.query<(RowDataPacket & { subjectId: number; subjectName: string; moduleId: number | null; moduleName: string | null; questionCount: number | string | null })[]>(
    `SELECT s.id AS subjectId, s.name AS subjectName, m.id AS moduleId, m.name AS moduleName,
       (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id
         WHERE t.module_id = m.id AND t.status = 'active' AND q.status = 'published') AS questionCount
     FROM subjects s LEFT JOIN modules m ON m.subject_id = s.id AND m.status = 'active'
     WHERE s.status = 'active' ORDER BY s.id ASC, m.id ASC`,
  );
  const subjects = new Map<number, PickerSubject>();
  for (const row of rows) {
    const subject = subjects.get(row.subjectId) ?? { id: row.subjectId, name: row.subjectName, slug: slugify(row.subjectName), modules: [] };
    if (row.moduleId !== null && row.moduleName !== null) {
      subject.modules.push({ id: row.moduleId, name: row.moduleName, questionCount: Number(row.questionCount ?? 0) });
    }
    subjects.set(row.subjectId, subject);
  }
  return [...subjects.values()];
}

// ---- Making a module -----------------------------------------------------------------------------

const RANK: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };

// Fisher-Yates: every order is equally likely
function shuffle<T>(items: T[]): T[] {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
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

// Picks the questions and saves the module. Returns null when no question matches the choices.
// The chosen difficulty comes first; if there are not enough of it, the nearest difficulties fill the rest.
export async function createCustomModule(studentId: number, request: CustomModuleRequest): Promise<CustomModuleSummary | null> {
  const [rows] = await pool.query<(RowDataPacket & { id: number; difficulty: Difficulty; answered: number; isCorrect: number | null; bookmarked: number })[]>(
    `SELECT q.id, q.difficulty, (a.question_id IS NOT NULL) AS answered, a.is_correct AS isCorrect, (b.question_id IS NOT NULL) AS bookmarked
     FROM questions q
     JOIN topics t ON t.id = q.topic_id JOIN modules m ON m.id = t.module_id JOIN subjects s ON s.id = t.subject_id
     LEFT JOIN student_answers a ON a.question_id = q.id AND a.student_id = ?
     LEFT JOIN student_bookmarks b ON b.question_id = q.id AND b.student_id = ?
     WHERE q.status = 'published' AND ${ACTIVE_CHAIN} AND m.id IN (?)`,
    [studentId, studentId, request.moduleIds],
  );

  // "qbank": only the kinds of question the student ticked. Attempted means answered correctly.
  const pool_ = rows.filter((row) => {
    if (request.source === "all") return true;
    if (request.source === "bookmarked") return row.bookmarked === 1;
    const answered = row.answered === 1;
    if (!answered) return request.qbank.unattempted;
    return row.isCorrect === 1 ? request.qbank.attempted : request.qbank.incorrect;
  });
  if (pool_.length === 0) return null;

  // Shuffle first, then sort by distance from the wanted difficulty: ties stay in random order
  const target = RANK[request.difficulty];
  const picked = shuffle(pool_)
    .sort((a, b) => Math.abs(RANK[a.difficulty] - target) - Math.abs(RANK[b.difficulty] - target))
    .slice(0, request.count);
  // The student should not meet all the easy ones first
  const ordered = shuffle(picked);

  const title = `Custom Module ${new Date().toISOString().slice(0, 16).replace("T", " ")}`;
  const moduleId = await inTransaction(async (connection) => {
    const [made] = await connection.query<ResultSetHeader>("INSERT INTO custom_modules (student_id, title) VALUES (?, ?)", [studentId, title]);
    await connection.query("INSERT INTO custom_module_questions (module_id, question_id, position) VALUES ?", [
      ordered.map((row, index) => [made.insertId, row.id, index + 1]),
    ]);
    // Keep the newest ones only
    await connection.query(
      `DELETE FROM custom_modules WHERE student_id = ? AND id NOT IN (
         SELECT id FROM (SELECT id FROM custom_modules WHERE student_id = ? ORDER BY id DESC LIMIT ${KEEP_PER_STUDENT}) newest)`,
      [studentId, studentId],
    );
    return made.insertId;
  });

  return { id: moduleId, title, questionCount: ordered.length, matching: pool_.length };
}

// ---- Solving a module -----------------------------------------------------------------------------

// The questions of one of this student's custom modules, in order, in the same shape as a practice session.
// Questions that were unpublished or switched off since the module was made are left out.
export async function getCustomModule(
  studentId: number,
  moduleId: number,
): Promise<{ id: number; title: string; questions: PracticeQuestion[] } | null> {
  const [modules] = await pool.query<(RowDataPacket & { id: number; title: string })[]>(
    "SELECT id, title FROM custom_modules WHERE id = ? AND student_id = ? LIMIT 1",
    [moduleId, studentId],
  );
  const module = modules[0];
  if (!module) return null;

  const [rows] = await pool.query<(RowDataPacket & { id: number; text: string; type: QuestionType; a: string; b: string; c: string; d: string; imageToken: string | null; bookmarked: number })[]>(
    `SELECT q.id, q.question_text AS text, q.type, q.option_a AS a, q.option_b AS b, q.option_c AS c, q.option_d AS d, q.image_token AS imageToken,
       (b.question_id IS NOT NULL) AS bookmarked
     FROM custom_module_questions cq
     JOIN questions q ON q.id = cq.question_id
     JOIN topics t ON t.id = q.topic_id JOIN modules m ON m.id = t.module_id JOIN subjects s ON s.id = t.subject_id
     LEFT JOIN student_bookmarks b ON b.question_id = q.id AND b.student_id = ?
     WHERE cq.module_id = ? AND q.status = 'published' AND ${ACTIVE_CHAIN}
     ORDER BY cq.position ASC`,
    [studentId, moduleId],
  );
  const questions = rows.map((row) => ({ id: row.id, text: row.text, type: row.type, options: { A: row.a, B: row.b, C: row.c, D: row.d } as Record<OptionKey, string>, imageToken: row.imageToken, bookmarked: row.bookmarked === 1 }));
  return { id: module.id, title: module.title, questions };
}
