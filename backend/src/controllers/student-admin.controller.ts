import type { Request, Response } from "express";
import {
  duplicateField,
  getAdminStudent,
  isMissingPlan,
  listAdminStudents,
  updateAdminStudent,
  type AdminStudentPatch,
} from "../services/student-admin.service";
import { normalizeMobile } from "../services/student.service";
import { EXAMS, type Exam } from "../types/student.types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Parsed = { ok: true; value: AdminStudentPatch } | { ok: false; message: string };

const bad = (message: string): Parsed => ({ ok: false, message });

// "12" or 12 -> 12; anything else -> null
function toId(raw: unknown): number | null {
  const id = typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : typeof raw === "number" ? raw : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// Real calendar check: "2026-02-31" has the right shape but is not a date
function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// Checks only the fields that were sent (this is a PATCH)
function parsePatch(body: unknown): Parsed {
  if (typeof body !== "object" || body === null) return bad("Send the student details as JSON");
  const data = body as Record<string, unknown>;
  const value: AdminStudentPatch = {};

  if (data.name !== undefined) {
    if (typeof data.name !== "string" || data.name.trim() === "") return bad("Enter the student's name.");
    if (data.name.trim().length > 100) return bad("The name must be 100 characters or fewer.");
    value.name = data.name.trim();
  }
  if (data.email !== undefined) {
    const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
    if (!email || email.length > 190 || !EMAIL_PATTERN.test(email)) return bad("Enter a valid email address.");
    value.email = email;
  }
  if (data.mobile !== undefined) {
    const mobile = typeof data.mobile === "string" ? normalizeMobile(data.mobile) : null;
    if (!mobile) return bad("Enter a valid 10-digit mobile number.");
    value.mobile = mobile;
  }
  if (data.exam !== undefined) {
    if (typeof data.exam !== "string" || !(EXAMS as readonly string[]).includes(data.exam)) return bad("Choose NEET PG or FMGE.");
    value.exam = data.exam as Exam;
  }
  if (data.status !== undefined) {
    if (data.status !== "active" && data.status !== "inactive") return bad("Status must be active or inactive.");
    value.status = data.status;
  }
  if (data.planId !== undefined) {
    if (data.planId === null || data.planId === "") {
      value.planId = null;
    } else {
      const planId = toId(data.planId);
      if (planId === null) return bad("The plan is not valid.");
      value.planId = planId;
    }
  }
  if (data.planExpiresAt !== undefined) {
    if (data.planExpiresAt === null || data.planExpiresAt === "") {
      value.planExpiresAt = null;
    } else if (typeof data.planExpiresAt !== "string" || !isRealDate(data.planExpiresAt)) {
      return bad("The plan expiry must be a date like 2027-03-31.");
    } else {
      value.planExpiresAt = data.planExpiresAt;
    }
  }
  return { ok: true, value };
}

const NOT_FOUND = { success: false, message: "Student not found" };
const FAILED = { success: false, message: "Something went wrong" };

export async function listStudentsHandler(_req: Request, res: Response): Promise<void> {
  try {
    res.json({ success: true, message: "Students", data: { students: await listAdminStudents() } });
  } catch (error) {
    console.error("List students failed:", error);
    res.status(500).json(FAILED);
  }
}

export async function getStudentHandler(req: Request, res: Response): Promise<void> {
  const id = toId(req.params.id);
  if (id === null) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  try {
    const student = await getAdminStudent(id);
    if (!student) res.status(404).json(NOT_FOUND);
    else res.json({ success: true, message: "Student", data: { student } });
  } catch (error) {
    console.error("Get student failed:", error);
    res.status(500).json(FAILED);
  }
}

// PATCH: send only the fields that change (name, email, mobile, exam, status, planId, planExpiresAt)
export async function updateStudentHandler(req: Request, res: Response): Promise<void> {
  const id = toId(req.params.id);
  if (id === null) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  const parsed = parsePatch(req.body);
  if (!parsed.ok) {
    res.status(400).json({ success: false, message: parsed.message });
    return;
  }
  try {
    const student = await updateAdminStudent(id, parsed.value);
    if (!student) res.status(404).json(NOT_FOUND);
    else res.json({ success: true, message: "Student updated", data: { student } });
  } catch (error) {
    const duplicate = duplicateField(error);
    if (duplicate) {
      const message = duplicate === "email" ? "This email address belongs to another student." : "This mobile number belongs to another student.";
      res.status(409).json({ success: false, message });
      return;
    }
    if (isMissingPlan(error)) {
      res.status(400).json({ success: false, message: "The chosen plan does not exist." });
      return;
    }
    console.error("Update student failed:", error);
    res.status(500).json(FAILED);
  }
}
