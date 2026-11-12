import type { Request, Response } from "express";
import {
  SUBJECT_ICONS,
  createSubject,
  deleteSubject,
  getSubject,
  isDuplicateError,
  listSubjects,
  updateSubject,
  type SubjectIcon,
  type SubjectInput,
  type SubjectStatus,
} from "../services/subject.service";

type Validation = { ok: true; value: Partial<SubjectInput> } | { ok: false; message: string };

// Checks a request body. With partial = false every field is required (create);
// with partial = true only the fields that were sent are checked (update).
function validate(body: unknown, partial: boolean): Validation {
  if (typeof body !== "object" || body === null) return { ok: false, message: "Send the subject details as JSON" };
  const data = body as Record<string, unknown>;
  const value: Partial<SubjectInput> = {};

  if (data.name !== undefined || !partial) {
    if (typeof data.name !== "string" || data.name.trim() === "") return { ok: false, message: "Enter the subject name" };
    if (data.name.trim().length > 100) return { ok: false, message: "Subject name must be 100 characters or fewer" };
    value.name = data.name.trim();
  }
  if (data.description !== undefined) {
    if (typeof data.description !== "string" || data.description.trim().length > 500) {
      return { ok: false, message: "Description must be 500 characters or fewer" };
    }
    value.description = data.description.trim();
  } else if (!partial) {
    value.description = "";
  }
  if (data.icon !== undefined) {
    if (typeof data.icon !== "string" || !(SUBJECT_ICONS as readonly string[]).includes(data.icon)) {
      return { ok: false, message: "Choose a valid icon" };
    }
    value.icon = data.icon as SubjectIcon;
  } else if (!partial) {
    value.icon = "stethoscope";
  }
  if (data.status !== undefined) {
    if (data.status !== "active" && data.status !== "inactive") return { ok: false, message: "Status must be active or inactive" };
    value.status = data.status as SubjectStatus;
  } else if (!partial) {
    value.status = "active";
  }
  return { ok: true, value };
}

// "12" -> 12; anything else -> null
function parseId(req: Request): number | null {
  const raw = req.params.id;
  const id = typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

const NOT_FOUND = { success: false, message: "Subject not found" };
const DUPLICATE = { success: false, message: "A subject with this name already exists" };
const FAILED = { success: false, message: "Something went wrong" };

export async function listSubjectsHandler(_req: Request, res: Response): Promise<void> {
  try {
    res.json({ success: true, message: "Subjects", data: { subjects: await listSubjects() } });
  } catch (error) {
    console.error("List subjects failed:", error);
    res.status(500).json(FAILED);
  }
}

export async function getSubjectHandler(req: Request, res: Response): Promise<void> {
  const id = parseId(req);
  if (id === null) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  try {
    const subject = await getSubject(id);
    if (!subject) res.status(404).json(NOT_FOUND);
    else res.json({ success: true, message: "Subject", data: { subject } });
  } catch (error) {
    console.error("Get subject failed:", error);
    res.status(500).json(FAILED);
  }
}

export async function createSubjectHandler(req: Request, res: Response): Promise<void> {
  const checked = validate(req.body, false);
  if (!checked.ok) {
    res.status(400).json({ success: false, message: checked.message });
    return;
  }
  try {
    const subject = await createSubject(checked.value as SubjectInput);
    res.status(201).json({ success: true, message: "Subject created", data: { subject } });
  } catch (error) {
    if (isDuplicateError(error)) {
      res.status(409).json(DUPLICATE);
      return;
    }
    console.error("Create subject failed:", error);
    res.status(500).json(FAILED);
  }
}

export async function updateSubjectHandler(req: Request, res: Response): Promise<void> {
  const id = parseId(req);
  if (id === null) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  const checked = validate(req.body, true);
  if (!checked.ok) {
    res.status(400).json({ success: false, message: checked.message });
    return;
  }
  try {
    const subject = await updateSubject(id, checked.value);
    if (!subject) res.status(404).json(NOT_FOUND);
    else res.json({ success: true, message: "Subject updated", data: { subject } });
  } catch (error) {
    if (isDuplicateError(error)) {
      res.status(409).json(DUPLICATE);
      return;
    }
    console.error("Update subject failed:", error);
    res.status(500).json(FAILED);
  }
}

export async function deleteSubjectHandler(req: Request, res: Response): Promise<void> {
  const id = parseId(req);
  if (id === null) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  try {
    const removed = await deleteSubject(id);
    if (!removed) res.status(404).json(NOT_FOUND);
    else res.json({ success: true, message: "Subject deleted" });
  } catch (error) {
    console.error("Delete subject failed:", error);
    res.status(500).json(FAILED);
  }
}
