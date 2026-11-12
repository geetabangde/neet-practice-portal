import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db";

export type TopicStatus = "active" | "inactive";

export interface Topic {
  id: number;
  subjectId: number;
  name: string;
  status: TopicStatus;
}

interface TopicRow extends RowDataPacket, Topic {}

export interface TopicInput {
  subjectId: number;
  name: string;
  status: TopicStatus;
}

// "subject_id AS subjectId" gives the API camelCase names while MySQL keeps snake_case
const COLUMNS = "id, subject_id AS subjectId, name, status";

// A topic belongs to one subject. Deleting the subject deletes its topics (ON DELETE CASCADE),
// and a name can be used only once inside the same subject.
export const CREATE_TOPICS_TABLE = `
  CREATE TABLE IF NOT EXISTS topics (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    subject_id INT UNSIGNED NOT NULL,
    name       VARCHAR(150) NOT NULL,
    status     ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_topics_subject_name (subject_id, name),
    KEY idx_topics_status (status),
    CONSTRAINT fk_topics_subject FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

function errno(error: unknown): number | null {
  return typeof error === "object" && error !== null && "errno" in error && typeof error.errno === "number" ? error.errno : null;
}

// 1062 = the (subject, name) pair already exists
export function isDuplicateTopic(error: unknown): boolean {
  return errno(error) === 1062;
}

// 1452 = subject_id points to a subject that does not exist
export function isMissingSubject(error: unknown): boolean {
  return errno(error) === 1452;
}

export async function listTopics(subjectId?: number): Promise<Topic[]> {
  const [rows] =
    subjectId === undefined
      ? await pool.query<TopicRow[]>(`SELECT ${COLUMNS} FROM topics ORDER BY id DESC`)
      : await pool.query<TopicRow[]>(`SELECT ${COLUMNS} FROM topics WHERE subject_id = ? ORDER BY id DESC`, [subjectId]);
  return rows;
}

export async function getTopic(id: number): Promise<Topic | null> {
  const [rows] = await pool.query<TopicRow[]>(`SELECT ${COLUMNS} FROM topics WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
}

export async function createTopic(input: TopicInput): Promise<Topic> {
  const [result] = await pool.query<ResultSetHeader>("INSERT INTO topics (subject_id, name, status) VALUES (?, ?, ?)", [
    input.subjectId,
    input.name,
    input.status,
  ]);
  const created = await getTopic(result.insertId);
  if (!created) throw new Error("Topic was inserted but could not be read back");
  return created;
}

// Returns null when no topic has this id
export async function updateTopic(id: number, patch: Partial<TopicInput>): Promise<Topic | null> {
  const current = await getTopic(id);
  if (!current) return null;
  const next = { ...current, ...patch };
  await pool.query("UPDATE topics SET subject_id = ?, name = ?, status = ? WHERE id = ?", [
    next.subjectId,
    next.name,
    next.status,
    id,
  ]);
  return { id, subjectId: next.subjectId, name: next.name, status: next.status };
}

export async function deleteTopic(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>("DELETE FROM topics WHERE id = ?", [id]);
  return result.affectedRows === 1;
}
