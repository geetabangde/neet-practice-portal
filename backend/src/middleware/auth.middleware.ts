import type { NextFunction, Request, Response } from "express";
import { ADMIN_ROLES, findAdminById, toSafeAdmin, verifyAdminToken } from "../services/auth.service";

// Guards admin-only routes. On success the safe admin is placed in res.locals.admin.
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  const [scheme, token] = header ? header.split(" ") : [];
  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  const adminId = verifyAdminToken(token);
  if (adminId === null) {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
    return;
  }

  try {
    // Look the admin up again: a deleted or deactivated admin is locked out even with an unexpired token
    const admin = await findAdminById(adminId);
    if (!admin || admin.status !== "active") {
      res.status(401).json({ success: false, message: "Invalid or expired token" });
      return;
    }
    if (!(ADMIN_ROLES as readonly string[]).includes(admin.role)) {
      res.status(403).json({ success: false, message: "Admin access required" });
      return;
    }
    res.locals.admin = toSafeAdmin(admin);
    next();
  } catch (error) {
    console.error("Auth check failed:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
}
