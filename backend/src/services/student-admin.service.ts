import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db";
import type { Exam, StudentStatus } from "../types/student.types";

// The admin's view of a student. Students create their own accounts (signup), so the admin can look at them
// and change their details, plan and status, but not add or delete them here.
export interface AdminStudent {
  id: number;
  name: string;
  mobile: string;
  email: string;
  exam: Exam;
  status: StudentStatus;
  planId: number | null;
  // YYYY-MM-DD
  planExpiresAt: string | null;
  registeredAt: string;
  // The day of the last login, null = never logged in since signup
  lastLoginAt: string | null;
}

interface AdminStudentRow extends RowDataPacket, AdminStudent {}

export interface AdminStudentPatch {
  name?: string;
  mobile?: string;
  email?: string;
  exam?: Exam;
  status?: StudentStatus;
  planId?: number | null;
  planExpiresAt?: string | null;
}

const COLUMNS = `id, name, mobile, email, exam, status, plan_id AS planId,
  DATE_FORMAT(plan_expires_at, '%Y-%m-%d') AS planExpiresAt,
  DATE_FORMAT(created_at, '%Y-%m-%d') AS registeredAt,
  DATE_FORMAT(last_login_at, '%Y-%m-%d') AS lastLoginAt`;

function errno(error: unknown): number | null {
  return typeof error === "object" && error !== null && "errno" in error && typeof error.errno === "number" ? error.errno : null;
}

function sqlMessage(error: unknown): string {
  return typeof error === "object" && error !== null && "sqlMessage" in error && typeof error.sqlMessage === "string" ? error.sqlMessage : "";
}

// 1062 = the mobile number or the email belongs to another student. Says which one.
export function duplicateField(error: unknown): "mobile" | "email" | null {
  if (errno(error) !== 1062) return null;
  return sqlMessage(error).includes("uq_students_email") ? "email" : "mobile";
}

// 1452 = plan_id points to a plan that does not exist
export function isMissingPlan(error: unknown): boolean {
  return errno(error) === 1452;
}

export async function listAdminStudents(): Promise<AdminStudent[]> {
  const [rows] = await pool.query<AdminStudentRow[]>(`SELECT ${COLUMNS} FROM students ORDER BY id DESC`);
  return rows;
}

export async function getAdminStudent(id: number): Promise<AdminStudent | null> {
  const [rows] = await pool.query<AdminStudentRow[]>(`SELECT ${COLUMNS} FROM students WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
}

// Returns null when no student has this id. Taking the plan away also clears its expiry date.
export async function updateAdminStudent(id: number, patch: AdminStudentPatch): Promise<AdminStudent | null> {
  const current = await getAdminStudent(id);
  if (!current) return null;

  const next = { ...current, ...patch };
  if (next.planId === null) next.planExpiresAt = null;

  // The plan runs to the end of its last day
  const expires = next.planExpiresAt ? `${next.planExpiresAt} 23:59:59` : null;
  await pool.query<ResultSetHeader>(
    "UPDATE students SET name = ?, mobile = ?, email = ?, exam = ?, status = ?, plan_id = ?, plan_expires_at = ? WHERE id = ?",
    [next.name, next.mobile, next.email, next.exam, next.status, next.planId, expires, id],
  );
  return getAdminStudent(id);
}
