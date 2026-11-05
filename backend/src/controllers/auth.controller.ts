import type { Request, Response } from "express";
import { checkPassword, findAdminByEmail, signAdminToken, toSafeAdmin } from "../services/auth.service";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/admin/login
export async function adminLogin(req: Request, res: Response): Promise<void> {
  const body: unknown = req.body;
  const email = typeof body === "object" && body !== null && "email" in body ? body.email : undefined;
  const password = typeof body === "object" && body !== null && "password" in body ? body.password : undefined;

  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ success: false, message: "Email and password are required" });
    return;
  }
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail.length > 190 || !EMAIL_PATTERN.test(cleanEmail)) {
    res.status(400).json({ success: false, message: "Enter a valid email address" });
    return;
  }
  // bcrypt only reads the first 72 bytes, and a huge password is a cheap way to slow the server down
  if (password.length === 0 || password.length > 72) {
    res.status(400).json({ success: false, message: "Enter a valid password" });
    return;
  }

  try {
    const admin = await findAdminByEmail(cleanEmail);
    const passwordOk = await checkPassword(password, admin);

    // One message for "no such email", "wrong password" and "inactive": nothing leaks which one it was
    if (!admin || !passwordOk || admin.status !== "active") {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    res.json({
      success: true,
      message: "Admin login successful",
      data: { admin: toSafeAdmin(admin), token: signAdminToken(admin) },
    });
  } catch (error) {
    console.error("Admin login failed:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
}

// GET /api/admin/profile (behind requireAdmin)
export function getAdminProfile(_req: Request, res: Response): void {
  res.json({ success: true, message: "Admin profile", data: { admin: res.locals.admin } });
}
