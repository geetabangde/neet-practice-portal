import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db";

export const SUBJECT_ICONS = [
  "bone", "activity", "microscope", "heart", "eye", "syringe", "brain", "flask",
  "pill", "dna", "baby", "droplets", "ear", "scan", "smile", "stethoscope",
] as const;
export type SubjectIcon = (typeof SUBJECT_ICONS)[number];
export type SubjectStatus = "active" | "inactive";

export interface Subject {
  id: number;
  name: string;
  description: string;
  icon: SubjectIcon;
  status: SubjectStatus;
}

interface SubjectRow extends RowDataPacket, Subject {}

export interface SubjectInput {
  name: string;
  description: string;
  icon: SubjectIcon;
  status: SubjectStatus;
}

const COLUMNS = "id, name, description, icon, status";

export const CREATE_SUBJECTS_TABLE = `
  CREATE TABLE IF NOT EXISTS subjects (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL DEFAULT '',
    icon        VARCHAR(30)  NOT NULL DEFAULT 'stethoscope',
    status      ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_subjects_name (name),
    KEY idx_subjects_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

// MySQL error 1062 = a UNIQUE key (the subject name) would be duplicated
export function isDuplicateError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "errno" in error && error.errno === 1062;
}

export async function listSubjects(): Promise<Subject[]> {
  const [rows] = await pool.query<SubjectRow[]>(`SELECT ${COLUMNS} FROM subjects ORDER BY id DESC`);
  return rows;
}

export async function getSubject(id: number): Promise<Subject | null> {
  const [rows] = await pool.query<SubjectRow[]>(`SELECT ${COLUMNS} FROM subjects WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
}

export async function createSubject(input: SubjectInput): Promise<Subject> {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO subjects (name, description, icon, status) VALUES (?, ?, ?, ?)",
    [input.name, input.description, input.icon, input.status],
  );
  const created = await getSubject(result.insertId);
  if (!created) throw new Error("Subject was inserted but could not be read back");
  return created;
}

// Returns null when no subject has this id
export async function updateSubject(id: number, patch: Partial<SubjectInput>): Promise<Subject | null> {
  const current = await getSubject(id);
  if (!current) return null;
  const next = { ...current, ...patch };
  await pool.query("UPDATE subjects SET name = ?, description = ?, icon = ?, status = ? WHERE id = ?", [
    next.name,
    next.description,
    next.icon,
    next.status,
    id,
  ]);
  return { id, name: next.name, description: next.description, icon: next.icon, status: next.status };
}

export async function deleteSubject(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>("DELETE FROM subjects WHERE id = ?", [id]);
  return result.affectedRows === 1;
}
