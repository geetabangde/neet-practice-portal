import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db";
import { OPTION_KEYS, type OptionKey, type QuestionType } from "./question.service";
import { slugify } from "./student-content.service";

// A student practises the published questions of one topic. A question is available only while its topic,
// the module of the topic and the subject are all active.
const ACTIVE_CHAIN = `t.status = 'active' AND m.status = 'active' AND s.status = 'active'`;

// What the website gets when a practice session starts. The right answer and the explanation are NOT in it:
// they are sent only after the student has answered, so nobody can read them from the page.
export interface PracticeQuestion {
  id: number;
  text: string;
  type: QuestionType;
  options: Record<OptionKey, string>;
}

export interface PracticeTopic {
  id: number;
  name: string;
  moduleName: string;
  subjectName: string;
  subjectSlug: string;
}

export interface AnswerFeedback {
  isCorrect: boolean;
  correct: OptionKey[];
  explanation: string;
  reference: string;
  // For each option, the share of students (in percent) who chose it
  percents: Record<OptionKey, number>;
}

// The last answer of each student to each question. Answering again replaces it and counts an attempt.
// This is what the progress bars are made from. Deleting a student or a question deletes its answers.
export const CREATE_ANSWERS_TABLE = `
  CREATE TABLE IF NOT EXISTS student_answers (
    student_id  INT UNSIGNED NOT NULL,
    question_id INT UNSIGNED NOT NULL,
    selected    VARCHAR(7) NOT NULL,
    is_correct  TINYINT(1) NOT NULL,
    attempts    SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    answered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, question_id),
    KEY idx_student_answers_question (question_id),
    CONSTRAINT fk_student_answers_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    CONSTRAINT fk_student_answers_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

interface TopicRow extends RowDataPacket {
  id: number;
  name: string;
  moduleName: string;
  subjectName: string;
}

interface QuestionRow extends RowDataPacket {
  id: number;
  text: string;
  type: QuestionType;
  a: string;
  b: string;
  c: string;
  d: string;
  correct: string;
  explanation: string;
  reference: string;
}

export async function getPracticeTopic(topicId: number): Promise<PracticeTopic | null> {
  const [rows] = await pool.query<TopicRow[]>(
    `SELECT t.id, t.name, m.name AS moduleName, s.name AS subjectName
     FROM topics t JOIN modules m ON m.id = t.module_id JOIN subjects s ON s.id = t.subject_id
     WHERE t.id = ? AND ${ACTIVE_CHAIN}`,
    [topicId],
  );
  const row = rows[0];
  return row ? { id: row.id, name: row.name, moduleName: row.moduleName, subjectName: row.subjectName, subjectSlug: slugify(row.subjectName) } : null;
}

export async function listPracticeQuestions(topicId: number): Promise<PracticeQuestion[]> {
  const [rows] = await pool.query<QuestionRow[]>(
    `SELECT q.id, q.question_text AS text, q.type, q.option_a AS a, q.option_b AS b, q.option_c AS c, q.option_d AS d
     FROM questions q JOIN topics t ON t.id = q.topic_id JOIN modules m ON m.id = t.module_id JOIN subjects s ON s.id = t.subject_id
     WHERE q.topic_id = ? AND q.status = 'published' AND ${ACTIVE_CHAIN}
     ORDER BY q.id ASC LIMIT 200`,
    [topicId],
  );
  return rows.map((row) => ({ id: row.id, text: row.text, type: row.type, options: { A: row.a, B: row.b, C: row.c, D: row.d } }));
}

// The facts needed to mark an answer. null when the question is missing, not published, or switched off.
export async function getQuestionToMark(
  questionId: number,
): Promise<{ id: number; type: QuestionType; correct: OptionKey[]; explanation: string; reference: string } | null> {
  const [rows] = await pool.query<QuestionRow[]>(
    `SELECT q.id, q.type, q.correct, q.explanation, q.reference_text AS reference
     FROM questions q JOIN topics t ON t.id = q.topic_id JOIN modules m ON m.id = t.module_id JOIN subjects s ON s.id = t.subject_id
     WHERE q.id = ? AND q.status = 'published' AND ${ACTIVE_CHAIN}`,
    [questionId],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    correct: row.correct === "" ? [] : (row.correct.split(",") as OptionKey[]),
    explanation: row.explanation,
    reference: row.reference,
  };
}

// Same letters, in any order
export function sameOptions(a: OptionKey[], b: OptionKey[]): boolean {
  return a.length === b.length && a.every((letter) => b.includes(letter));
}

// Saves the answer. A second answer to the same question replaces the first and adds one to "attempts".
export async function saveAnswer(studentId: number, questionId: number, selected: OptionKey[], isCorrect: boolean): Promise<void> {
  await pool.query<ResultSetHeader>(
    `INSERT INTO student_answers (student_id, question_id, selected, is_correct)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE selected = VALUES(selected), is_correct = VALUES(is_correct), attempts = attempts + 1, answered_at = NOW()`,
    [studentId, questionId, [...selected].sort().join(","), isCorrect ? 1 : 0],
  );
}

// "42.5% of students chose B". Counted from the last answer of every student.
export async function optionPercents(questionId: number): Promise<Record<OptionKey, number>> {
  const [rows] = await pool.query<(RowDataPacket & { selected: string })[]>("SELECT selected FROM student_answers WHERE question_id = ?", [questionId]);
  const percents = { A: 0, B: 0, C: 0, D: 0 } as Record<OptionKey, number>;
  if (rows.length === 0) return percents;
  for (const key of OPTION_KEYS) {
    const chose = rows.filter((row) => row.selected.split(",").includes(key)).length;
    percents[key] = Math.round((chose / rows.length) * 10000) / 100;
  }
  return percents;
}
