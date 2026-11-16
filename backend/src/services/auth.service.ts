import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db";
import type { AdminRow, SafeAdmin, TokenPayload, TokenRole } from "../types/auth.types";

export const CREATE_ADMINS_TABLE = `
  CREATE TABLE IF NOT EXISTS admins (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(190) NOT NULL,
    password   VARCHAR(255) NOT NULL,
    role       VARCHAR(30)  NOT NULL DEFAULT 'admin',
    status     ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_admins_email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

export const ADMIN_ROLES = ["admin"] as const;

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET is missing or shorter than 32 characters");
  }
  return secret;
}

// Called once at startup so a bad config stops the server immediately
export function assertAuthConfig(): void {
  jwtSecret();
}

export async function findAdminByEmail(email: string): Promise<AdminRow | null> {
  // "?" is a placeholder: mysql2 sends the value separately, so it can never become SQL (no SQL injection)
  const [rows] = await pool.query<AdminRow[]>(
    "SELECT id, name, email, password, role, status FROM admins WHERE email = ? LIMIT 1",
    [email],
  );
  return rows[0] ?? null;
}

export async function findAdminById(id: number): Promise<AdminRow | null> {
  const [rows] = await pool.query<AdminRow[]>(
    "SELECT id, name, email, password, role, status FROM admins WHERE id = ? LIMIT 1",
    [id],
  );
  return rows[0] ?? null;
}

// A real bcrypt hash of a throwaway string. When the email does not exist we still compare against it,
// so "unknown email" and "wrong password" take the same time and look the same to an attacker.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

export async function checkPassword(plain: string, admin: AdminRow | null): Promise<boolean> {
  const matches = await bcrypt.compare(plain, admin ? admin.password : DUMMY_HASH);
  return admin !== null && matches;
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export function toSafeAdmin(admin: AdminRow): SafeAdmin {
  return { id: admin.id, name: admin.name, email: admin.email, role: admin.role };
}

// Signs a token for one person. "role" says whether it is an admin or a student token.
export function signToken(id: number, role: TokenRole, expiresIn: string): string {
  const payload: TokenPayload = { sub: String(id), role };
  return jwt.sign(payload, jwtSecret(), { algorithm: "HS256", expiresIn: expiresIn as jwt.SignOptions["expiresIn"] });
}

// Returns the id when the token is genuine, not expired and of the wanted kind, otherwise null.
// A student token can never pass as an admin token (or the other way round), even if the ids match.
export function verifyToken(token: string, role: TokenRole): number | null {
  try {
    const decoded = jwt.verify(token, jwtSecret(), { algorithms: ["HS256"] });
    if (typeof decoded === "string" || typeof decoded.sub !== "string" || decoded.role !== role) return null;
    const id = Number(decoded.sub);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

export function signAdminToken(admin: AdminRow): string {
  return signToken(admin.id, "admin", process.env.JWT_EXPIRES_IN ?? "1d");
}

export function verifyAdminToken(token: string): number | null {
  return verifyToken(token, "admin");
}
