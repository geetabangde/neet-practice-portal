import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db";

export type TopicStatus = "active" | "inactive";

// A topic lives inside a module (subject > module > topic). subjectId is the subject of that module;
// it is kept on the topic as well, so questions and tests can still ask "which subject".
export interface Topic {
  id: number;
  subjectId: number;
  moduleId: number;
  name: string;
  durationMinutes: number;
  status: TopicStatus;
}

interface TopicRow extends RowDataPacket, Topic {}

export interface TopicInput {
  moduleId: number;
  name: string;
  durationMinutes?: number;
  status: TopicStatus;
}

// "subject_id AS subjectId" gives the API camelCase names while MySQL keeps snake_case
const COLUMNS = "id, subject_id AS subjectId, module_id AS moduleId, name, duration_minutes AS durationMinutes, status";

// A name can be used only once inside the same module. Deleting a module deletes its topics (ON DELETE CASCADE).
// An older database is changed to this shape by migrateTopicsToModules (npm run db:setup).
export const CREATE_TOPICS_TABLE = `
  CREATE TABLE IF NOT EXISTS topics (
    id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
    subject_id       INT UNSIGNED NOT NULL,
    module_id        INT UNSIGNED NOT NULL,
    name             VARCHAR(150) NOT NULL,
    duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 15,
    status           ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_topics_module_name (module_id, name),
    KEY idx_topics_subject (subject_id),
    KEY idx_topics_status (status),
    CONSTRAINT fk_topics_subject FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE,
    CONSTRAINT fk_topics_module FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

// Why a topic could not be put in a module
export class TopicModuleError extends Error {
  constructor(readonly reason: "missing" | "other_subject") {
    super(reason);
  }
}

function errno(error: unknown): number | null {
  return typeof error === "object" && error !== null && "errno" in error && typeof error.errno === "number" ? error.errno : null;
}

// 1062 = the (module, name) pair already exists
export function isDuplicateTopic(error: unknown): boolean {
  return errno(error) === 1062;
}

export async function subjectOfModule(moduleId: number): Promise<number | null> {
  const [rows] = await pool.query<(RowDataPacket & { subjectId: number })[]>(
    "SELECT subject_id AS subjectId FROM modules WHERE id = ? LIMIT 1",
    [moduleId],
  );
  return rows[0]?.subjectId ?? null;
}

export async function listTopics(filter: { subjectId?: number; moduleId?: number } = {}): Promise<Topic[]> {
  const conditions: string[] = [];
  const values: number[] = [];
  if (filter.subjectId !== undefined) {
    conditions.push("subject_id = ?");
    values.push(filter.subjectId);
  }
  if (filter.moduleId !== undefined) {
    conditions.push("module_id = ?");
    values.push(filter.moduleId);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  try {
    const [rows] = await pool.query<TopicRow[]>(`SELECT ${COLUMNS} FROM topics ${where} ORDER BY id ASC`, values);
    return rows;
  } catch (error) {
    if (errno(error) === 1054) {
      await migrateTopicDuration();
      const [rows] = await pool.query<TopicRow[]>(`SELECT ${COLUMNS} FROM topics ${where} ORDER BY id ASC`, values);
      return rows;
    }
    throw error;
  }
}

export async function getTopic(id: number): Promise<Topic | null> {
  try {
    const [rows] = await pool.query<TopicRow[]>(`SELECT ${COLUMNS} FROM topics WHERE id = ? LIMIT 1`, [id]);
    return rows[0] ?? null;
  } catch (error) {
    if (errno(error) === 1054) {
      await migrateTopicDuration();
      const [rows] = await pool.query<TopicRow[]>(`SELECT ${COLUMNS} FROM topics WHERE id = ? LIMIT 1`, [id]);
      return rows[0] ?? null;
    }
    throw error;
  }
}

// The subject comes from the module, so a topic can never disagree with its module
export async function createTopic(input: TopicInput): Promise<Topic> {
  const subjectId = await subjectOfModule(input.moduleId);
  if (subjectId === null) throw new TopicModuleError("missing");
  const duration = input.durationMinutes ?? 15;
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO topics (subject_id, module_id, name, duration_minutes, status) VALUES (?, ?, ?, ?, ?)",
    [subjectId, input.moduleId, input.name, duration, input.status],
  );
  const created = await getTopic(result.insertId);
  if (!created) throw new Error("Topic was inserted but could not be read back");
  return created;
}

// A topic may move to another module, but only inside its own subject (its questions stay valid).
// Returns null when no topic has this id.
export async function updateTopic(id: number, patch: Partial<TopicInput>): Promise<Topic | null> {
  const current = await getTopic(id);
  if (!current) return null;
  const next = { ...current, ...patch };

  if (next.moduleId !== current.moduleId) {
    const subjectId = await subjectOfModule(next.moduleId);
    if (subjectId === null) throw new TopicModuleError("missing");
    if (subjectId !== current.subjectId) throw new TopicModuleError("other_subject");
  }

  const duration = next.durationMinutes ?? 15;
  await pool.query("UPDATE topics SET module_id = ?, name = ?, duration_minutes = ?, status = ? WHERE id = ?", [
    next.moduleId,
    next.name,
    duration,
    next.status,
    id,
  ]);
  return { id, subjectId: current.subjectId, moduleId: next.moduleId, name: next.name, durationMinutes: duration, status: next.status };
}

export async function deleteTopic(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>("DELETE FROM topics WHERE id = ?", [id]);
  return result.affectedRows === 1;
}

// An older database has topics without duration_minutes: this adds the column with default 15 minutes
export async function migrateTopicDuration(): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'topics' AND COLUMN_NAME = 'duration_minutes'",
  );
  if (rows.length > 0) return false;
  await pool.query("ALTER TABLE topics ADD COLUMN duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 15 AFTER name");
  return true;
}
