import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db";

export const OPTION_KEYS = ["A", "B", "C", "D"] as const;
export type OptionKey = (typeof OPTION_KEYS)[number];
export type Difficulty = "easy" | "medium" | "hard";
export type QuestionType = "single" | "multiple";
export type QuestionStatus = "published" | "draft";

export interface Question {
  id: number;
  // A draft may not have a subject or topic yet
  subjectId: number | null;
  topicId: number | null;
  text: string;
  difficulty: Difficulty;
  type: QuestionType;
  options: Record<OptionKey, string>;
  correct: OptionKey[];
  explanation: string;
  reference: string;
  // The name of the file the admin chose
  imageName: string;
  // Token of the saved picture (shown at /api/images/<token>), or null when the question has no image
  imageToken: string | null;
  status: QuestionStatus;
  createdAt: string;
}

export type QuestionInput = Omit<Question, "id" | "createdAt">;

// One row as MySQL returns it: the four options and the correct letters are flat columns
interface QuestionRow extends RowDataPacket {
  id: number;
  subjectId: number | null;
  topicId: number | null;
  text: string;
  difficulty: Difficulty;
  type: QuestionType;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correct: string;
  explanation: string;
  reference: string;
  imageName: string;
  imageToken: string | null;
  status: QuestionStatus;
  createdAt: string;
}

// Column AS alias: the API uses camelCase, MySQL keeps snake_case
const COLUMNS = `id, subject_id AS subjectId, topic_id AS topicId, question_text AS text, difficulty, type,
  option_a AS optionA, option_b AS optionB, option_c AS optionC, option_d AS optionD, correct,
  explanation, reference_text AS reference, image_name AS imageName, image_token AS imageToken, status,
  DATE_FORMAT(created_at, '%Y-%m-%d') AS createdAt`;

// Deleting a subject or topic deletes its questions (ON DELETE CASCADE).
// "correct" holds the right letters joined by commas, e.g. "A" or "A,C".
export const CREATE_QUESTIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS questions (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    subject_id    INT UNSIGNED NULL,
    topic_id      INT UNSIGNED NULL,
    question_text TEXT NOT NULL,
    difficulty    ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
    type          ENUM('single','multiple') NOT NULL DEFAULT 'single',
    option_a      TEXT NOT NULL,
    option_b      TEXT NOT NULL,
    option_c      TEXT NOT NULL,
    option_d      TEXT NOT NULL,
    correct       VARCHAR(7) NOT NULL DEFAULT '',
    explanation   TEXT NOT NULL,
    reference_text VARCHAR(255) NOT NULL DEFAULT '',
    image_name    VARCHAR(255) NOT NULL DEFAULT '',
    image_token   CHAR(32) NULL,
    status        ENUM('published','draft') NOT NULL DEFAULT 'draft',
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_questions_subject (subject_id),
    KEY idx_questions_topic (topic_id),
    KEY idx_questions_status (status),
    CONSTRAINT fk_questions_subject FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE,
    CONSTRAINT fk_questions_topic FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

function toQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    subjectId: row.subjectId,
    topicId: row.topicId,
    text: row.text,
    difficulty: row.difficulty,
    type: row.type,
    options: { A: row.optionA, B: row.optionB, C: row.optionC, D: row.optionD },
    correct: row.correct === "" ? [] : (row.correct.split(",") as OptionKey[]),
    explanation: row.explanation,
    reference: row.reference,
    imageName: row.imageName,
    imageToken: row.imageToken,
    status: row.status,
    createdAt: row.createdAt,
  };
}

// The rules for the finished question. A draft only needs text; a published question must be complete.
export function findQuestionProblem(q: QuestionInput): string | null {
  if (q.type === "single" && q.correct.length > 1) return "A single correct question can have only one correct option";
  if (q.topicId !== null && q.subjectId === null) return "Choose the subject of this topic";
  if (q.status === "draft") return null;

  if (q.subjectId === null) return "Choose a subject";
  if (q.topicId === null) return "Choose a topic";
  for (const key of OPTION_KEYS) if (q.options[key] === "") return `Write option ${key}`;
  if (q.correct.length === 0) return "Mark the correct answer";
  if (q.type === "multiple" && q.correct.length < 2) return "A multiple correct question needs at least two correct options";
  if (q.explanation === "") return "Write the explanation students will see";
  return null;
}

// 1452 = subject_id or topic_id points to a row that does not exist
export function isMissingParent(error: unknown): boolean {
  return typeof error === "object" && error !== null && "errno" in error && error.errno === 1452;
}

export async function topicBelongsToSubject(topicId: number, subjectId: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT id FROM topics WHERE id = ? AND subject_id = ? LIMIT 1", [
    topicId,
    subjectId,
  ]);
  return rows.length === 1;
}

export async function listQuestions(): Promise<Question[]> {
  const [rows] = await pool.query<QuestionRow[]>(`SELECT ${COLUMNS} FROM questions ORDER BY id DESC`);
  return rows.map(toQuestion);
}

export async function getQuestion(id: number): Promise<Question | null> {
  const [rows] = await pool.query<QuestionRow[]>(`SELECT ${COLUMNS} FROM questions WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ? toQuestion(rows[0]) : null;
}

// The values of a question in the order of the INSERT column list (used here and by the bulk import)
export function questionValues(input: QuestionInput): (string | number | null)[] {
  return [
    input.subjectId,
    input.topicId,
    input.text,
    input.difficulty,
    input.type,
    input.options.A,
    input.options.B,
    input.options.C,
    input.options.D,
    input.correct.join(","),
    input.explanation,
    input.reference,
    input.imageName,
    input.imageToken,
    input.status,
  ];
}

export async function createQuestion(input: QuestionInput): Promise<Question> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO questions (subject_id, topic_id, question_text, difficulty, type, option_a, option_b, option_c, option_d,
       correct, explanation, reference_text, image_name, image_token, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    questionValues(input),
  );
  const created = await getQuestion(result.insertId);
  if (!created) throw new Error("Question was inserted but could not be read back");
  return created;
}

// Writes a complete, already validated question. Returns false when no question has this id.
export async function replaceQuestion(id: number, input: QuestionInput): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE questions SET subject_id = ?, topic_id = ?, question_text = ?, difficulty = ?, type = ?,
       option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct = ?, explanation = ?,
       reference_text = ?, image_name = ?, image_token = ?, status = ?
     WHERE id = ?`,
    [...questionValues(input), id],
  );
  return result.affectedRows === 1;
}

export async function deleteQuestion(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>("DELETE FROM questions WHERE id = ?", [id]);
  return result.affectedRows === 1;
}
