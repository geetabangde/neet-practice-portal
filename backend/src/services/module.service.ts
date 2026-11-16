import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db";

export type ModuleStatus = "active" | "inactive";

// A module is a part of a subject. Topics live inside modules: subject > module > topic.
export interface Module {
  id: number;
  subjectId: number;
  name: string;
  status: ModuleStatus;
}

interface ModuleRow extends RowDataPacket, Module {}

export interface ModuleInput {
  subjectId: number;
  name: string;
  status: ModuleStatus;
}

const COLUMNS = "id, subject_id AS subjectId, name, status";

// Deleting a subject deletes its modules, and deleting a module deletes its topics (ON DELETE CASCADE).
// A name can be used only once inside the same subject.
export const CREATE_MODULES_TABLE = `
  CREATE TABLE IF NOT EXISTS modules (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    subject_id INT UNSIGNED NOT NULL,
    name       VARCHAR(150) NOT NULL,
    status     ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_modules_subject_name (subject_id, name),
    KEY idx_modules_status (status),
    CONSTRAINT fk_modules_subject FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

function errno(error: unknown): number | null {
  return typeof error === "object" && error !== null && "errno" in error && typeof error.errno === "number" ? error.errno : null;
}

// 1062 = this subject already has a module with this name
export function isDuplicateModule(error: unknown): boolean {
  return errno(error) === 1062;
}

// 1452 = subject_id points to a subject that does not exist
export function isMissingSubjectForModule(error: unknown): boolean {
  return errno(error) === 1452;
}

export async function listModules(subjectId?: number): Promise<Module[]> {
  const [rows] =
    subjectId === undefined
      ? await pool.query<ModuleRow[]>(`SELECT ${COLUMNS} FROM modules ORDER BY id ASC`)
      : await pool.query<ModuleRow[]>(`SELECT ${COLUMNS} FROM modules WHERE subject_id = ? ORDER BY id ASC`, [subjectId]);
  return rows;
}

export async function getModule(id: number): Promise<Module | null> {
  const [rows] = await pool.query<ModuleRow[]>(`SELECT ${COLUMNS} FROM modules WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
}

export async function createModule(input: ModuleInput): Promise<Module> {
  const [result] = await pool.query<ResultSetHeader>("INSERT INTO modules (subject_id, name, status) VALUES (?, ?, ?)", [
    input.subjectId,
    input.name,
    input.status,
  ]);
  const created = await getModule(result.insertId);
  if (!created) throw new Error("Module was inserted but could not be read back");
  return created;
}

// The subject of a module can not change: a module stays in the subject it was made in.
// Returns null when no module has this id.
export async function updateModule(id: number, patch: Partial<Pick<ModuleInput, "name" | "status">>): Promise<Module | null> {
  const current = await getModule(id);
  if (!current) return null;
  const next = { ...current, ...patch };
  await pool.query("UPDATE modules SET name = ?, status = ? WHERE id = ?", [next.name, next.status, id]);
  return { id, subjectId: current.subjectId, name: next.name, status: next.status };
}

export async function deleteModule(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>("DELETE FROM modules WHERE id = ?", [id]);
  return result.affectedRows === 1;
}

// ---- Moving an older database to the module structure ------------------------------------------
// Before modules existed, a topic belonged straight to a subject. This gives every subject that has topics
// one module called "General", puts those topics inside it, and then makes module_id compulsory.
// It runs again safely: when topics already have module_id, it does nothing.
export async function migrateTopicsToModules(): Promise<"already done" | "migrated"> {
  const [columns] = await pool.query<(RowDataPacket & { total: number })[]>(
    `SELECT COUNT(*) AS total FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'topics' AND COLUMN_NAME = 'module_id'`,
  );
  if (Number(columns[0]?.total ?? 0) > 0) return "already done";

  await pool.query("ALTER TABLE topics ADD COLUMN module_id INT UNSIGNED NULL AFTER subject_id");
  await pool.query("INSERT IGNORE INTO modules (subject_id, name, status) SELECT DISTINCT subject_id, 'General', 'active' FROM topics");
  await pool.query(
    "UPDATE topics t JOIN modules m ON m.subject_id = t.subject_id AND m.name = 'General' SET t.module_id = m.id WHERE t.module_id IS NULL",
  );
  await pool.query("ALTER TABLE topics MODIFY module_id INT UNSIGNED NOT NULL");
  // The foreign key on subject_id needs an index of its own before the old (subject, name) key can go
  await pool.query("ALTER TABLE topics ADD KEY idx_topics_subject (subject_id)");
  await pool.query("ALTER TABLE topics DROP INDEX uq_topics_subject_name");
  await pool.query("ALTER TABLE topics ADD UNIQUE KEY uq_topics_module_name (module_id, name)");
  await pool.query("ALTER TABLE topics ADD CONSTRAINT fk_topics_module FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE");
  return "migrated";
}
