import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db";
import type { Exam, OtpCheck, OtpPurpose, SafeStudent, StudentRow } from "../types/student.types";
import { signToken, verifyToken } from "./auth.service";

export const OTP_LENGTH = 6;
const OTP_LIFETIME_MINUTES = 5;
const OTP_MAX_WRONG_TRIES = 5;
// A new OTP can be asked for only after this many seconds, and at most this many times an hour,
// so nobody can use the form to flood one phone with messages
export const OTP_RESEND_SECONDS = 30;
const OTP_MAX_PER_HOUR = 5;

// A student is signed in for a week unless STUDENT_JWT_EXPIRES_IN says otherwise
const studentTokenLife = () => process.env.STUDENT_JWT_EXPIRES_IN ?? "7d";

// plan_id and plan_expires_at are for the payments work later; a deleted plan leaves the student without one
export const CREATE_STUDENT_TABLES = [
  `CREATE TABLE IF NOT EXISTS students (
    id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name            VARCHAR(100) NOT NULL,
    mobile          CHAR(10) NOT NULL,
    email           VARCHAR(190) NOT NULL,
    exam            ENUM('NEET PG','FMGE') NOT NULL DEFAULT 'NEET PG',
    status          ENUM('active','inactive') NOT NULL DEFAULT 'active',
    plan_id         INT UNSIGNED NULL,
    plan_expires_at DATETIME NULL,
    last_login_at   DATETIME NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_students_mobile (mobile),
    UNIQUE KEY uq_students_email (email),
    KEY idx_students_status (status),
    CONSTRAINT fk_students_plan FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  // Only a hash of each OTP is kept, never the OTP itself. Old rows are cleaned up as new ones come in.
  `CREATE TABLE IF NOT EXISTS student_otps (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    mobile     CHAR(10) NOT NULL,
    purpose    ENUM('signup','login') NOT NULL,
    code_hash  CHAR(64) NOT NULL,
    attempts   TINYINT UNSIGNED NOT NULL DEFAULT 0,
    expires_at DATETIME NOT NULL,
    used_at    DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_student_otps_lookup (mobile, purpose, id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

// 1062 = a UNIQUE key (mobile or email) would be duplicated
export function isDuplicateStudent(error: unknown): boolean {
  return typeof error === "object" && error !== null && "errno" in error && error.errno === 1062;
}

// "+91 98765-43210" -> "9876543210". Same rule as the signup form. Returns null when it is not a valid number.
export function normalizeMobile(value: string): string | null {
  const match = /^(?:\+?91)?(\d{10})$/.exec(value.replace(/[\s-]/g, ""));
  return match ? match[1] : null;
}

export function toSafeStudent(student: StudentRow): SafeStudent {
  return { id: student.id, name: student.name, mobile: student.mobile, email: student.email, exam: student.exam };
}

const STUDENT_COLUMNS = "id, name, mobile, email, exam, status";

export async function findStudentById(id: number): Promise<StudentRow | null> {
  const [rows] = await pool.query<StudentRow[]>(`SELECT ${STUDENT_COLUMNS} FROM students WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
}

export async function findStudentByMobile(mobile: string): Promise<StudentRow | null> {
  const [rows] = await pool.query<StudentRow[]>(`SELECT ${STUDENT_COLUMNS} FROM students WHERE mobile = ? LIMIT 1`, [mobile]);
  return rows[0] ?? null;
}

export async function findStudentByEmail(email: string): Promise<StudentRow | null> {
  const [rows] = await pool.query<StudentRow[]>(`SELECT ${STUDENT_COLUMNS} FROM students WHERE email = ? LIMIT 1`, [email]);
  return rows[0] ?? null;
}

export async function createStudent(input: { name: string; mobile: string; email: string; exam: Exam }): Promise<StudentRow> {
  const [result] = await pool.query<ResultSetHeader>("INSERT INTO students (name, mobile, email, exam) VALUES (?, ?, ?, ?)", [
    input.name,
    input.mobile,
    input.email,
    input.exam,
  ]);
  const created = await findStudentById(result.insertId);
  if (!created) throw new Error("Student was inserted but could not be read back");
  return created;
}

export async function markLoggedIn(id: number): Promise<void> {
  await pool.query("UPDATE students SET last_login_at = NOW() WHERE id = ?", [id]);
}

export function signStudentToken(student: StudentRow): string {
  return signToken(student.id, "student", studentTokenLife());
}

export function verifyStudentToken(token: string): number | null {
  return verifyToken(token, "student");
}

// ---- OTP -----------------------------------------------------------------------------------

// The OTP is tied to the phone number and the purpose, so one cannot be reused for another login
function hashOtp(mobile: string, purpose: OtpPurpose, code: string): string {
  const secret = process.env.JWT_SECRET ?? "";
  return createHmac("sha256", secret).update(`${mobile}:${purpose}:${code}`).digest("hex");
}

export type OtpIssue = { ok: true; code: string } | { ok: false; reason: "wait" | "too_many_requests"; waitSeconds: number };

// Makes a new random OTP and stores its hash. The older OTP of this phone stops working.
export async function issueOtp(mobile: string, purpose: OtpPurpose): Promise<OtpIssue> {
  // Housekeeping: nobody needs OTP rows older than a day
  await pool.query("DELETE FROM student_otps WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 DAY)");

  const [latest] = await pool.query<(RowDataPacket & { age: number })[]>(
    "SELECT TIMESTAMPDIFF(SECOND, created_at, NOW()) AS age FROM student_otps WHERE mobile = ? AND purpose = ? ORDER BY id DESC LIMIT 1",
    [mobile, purpose],
  );
  const age = latest[0]?.age;
  if (age !== undefined && age < OTP_RESEND_SECONDS) {
    return { ok: false, reason: "wait", waitSeconds: OTP_RESEND_SECONDS - age };
  }

  const [recent] = await pool.query<(RowDataPacket & { total: number })[]>(
    "SELECT COUNT(*) AS total FROM student_otps WHERE mobile = ? AND purpose = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)",
    [mobile, purpose],
  );
  if (Number(recent[0]?.total ?? 0) >= OTP_MAX_PER_HOUR) {
    return { ok: false, reason: "too_many_requests", waitSeconds: 3600 };
  }

  // randomInt uses the system's secure random generator; padStart keeps leading zeros ("004821")
  const code = String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
  await pool.query("UPDATE student_otps SET used_at = NOW() WHERE mobile = ? AND purpose = ? AND used_at IS NULL", [mobile, purpose]);
  await pool.query(
    `INSERT INTO student_otps (mobile, purpose, code_hash, expires_at)
     VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ${OTP_LIFETIME_MINUTES} MINUTE))`,
    [mobile, purpose, hashOtp(mobile, purpose, code)],
  );
  return { ok: true, code };
}

// Checks what the student typed against the newest OTP of this phone. A right OTP works only once.
export async function checkOtp(mobile: string, purpose: OtpPurpose, code: string): Promise<OtpCheck> {
  const [rows] = await pool.query<(RowDataPacket & { id: number; code_hash: string; attempts: number; alive: number })[]>(
    `SELECT id, code_hash, attempts, (expires_at > NOW()) AS alive FROM student_otps
     WHERE mobile = ? AND purpose = ? AND used_at IS NULL ORDER BY id DESC LIMIT 1`,
    [mobile, purpose],
  );
  const otp = rows[0];
  if (!otp || !otp.alive) return "expired";
  if (otp.attempts >= OTP_MAX_WRONG_TRIES) return "too_many";

  const expected = Buffer.from(otp.code_hash, "hex");
  const given = Buffer.from(hashOtp(mobile, purpose, code), "hex");
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    await pool.query("UPDATE student_otps SET attempts = attempts + 1 WHERE id = ?", [otp.id]);
    return otp.attempts + 1 >= OTP_MAX_WRONG_TRIES ? "too_many" : "wrong";
  }

  // "used_at IS NULL" in the WHERE makes sure two requests with the same right OTP cannot both win
  const [used] = await pool.query<ResultSetHeader>("UPDATE student_otps SET used_at = NOW() WHERE id = ? AND used_at IS NULL", [otp.id]);
  return used.affectedRows === 1 ? "ok" : "expired";
}
