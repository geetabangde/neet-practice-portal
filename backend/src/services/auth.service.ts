import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db";
import type { AdminRow, AdminTokenPayload, SafeAdmin } from "../types/auth.types";

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

export function signAdminToken(admin: AdminRow): string {
  const payload: AdminTokenPayload = { sub: String(admin.id) };
  return jwt.sign(payload, jwtSecret(), {
    algorithm: "HS256",
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "1d") as jwt.SignOptions["expiresIn"],
  });
}

// Returns the admin id when the token is genuine and not expired, otherwise null
export function verifyAdminToken(token: string): number | null {
  try {
    const decoded = jwt.verify(token, jwtSecret(), { algorithms: ["HS256"] });
    if (typeof decoded === "string" || typeof decoded.sub !== "string") return null;
    const id = Number(decoded.sub);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}
