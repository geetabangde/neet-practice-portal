import type { Request, Response } from "express";
import {
  MAX_QUESTIONS,
  createCustomModule,
  getCustomModule,
  listPickerSubjects,
  type CustomModuleRequest,
} from "../services/custom-module.service";

const FAILED = { success: false, message: "Something went wrong" };

// "12" or 12 -> 12; anything else -> null
function toId(raw: unknown): number | null {
  const id = typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : typeof raw === "number" ? raw : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function studentIdOf(res: Response): number {
  return (res.locals.student as { id: number }).id;
}

// GET /api/student/custom-module/options  ->  the subjects and modules the student can choose from
export async function customModuleOptionsHandler(_req: Request, res: Response): Promise<void> {
  try {
    res.json({ success: true, message: "Options", data: { subjects: await listPickerSubjects() } });
  } catch (error) {
    console.error("Custom module options failed:", error);
    res.status(500).json(FAILED);
  }
}

type Parsed = { ok: true; value: CustomModuleRequest } | { ok: false; message: string };

function parseRequest(body: unknown): Parsed {
  const bad = (message: string): Parsed => ({ ok: false, message });
  if (typeof body !== "object" || body === null) return bad("Send the choices as JSON.");
  const data = body as Record<string, unknown>;

  const count = typeof data.count === "number" && Number.isInteger(data.count) ? data.count : NaN;
  if (!(count >= 1 && count <= MAX_QUESTIONS)) return bad(`Choose between 1 and ${MAX_QUESTIONS} questions.`);

  if (data.difficulty !== "easy" && data.difficulty !== "medium" && data.difficulty !== "hard") return bad("Choose a difficulty level.");

  if (data.source === "graded") return bad("This question source is not available yet.");
  if (data.source !== "all" && data.source !== "qbank" && data.source !== "bookmarked") return bad("Choose where the questions come from.");

  const qbankRaw = typeof data.qbank === "object" && data.qbank !== null ? (data.qbank as Record<string, unknown>) : {};
  const qbank = { attempted: qbankRaw.attempted === true, incorrect: qbankRaw.incorrect === true, unattempted: qbankRaw.unattempted === true };
  if (data.source === "qbank" && !qbank.attempted && !qbank.incorrect && !qbank.unattempted) {
    return bad("Choose at least one of Attempted, Incorrect or Unattempted.");
  }

  const raw = data.moduleIds;
  const moduleIds = Array.isArray(raw) && raw.length >= 1 && raw.length <= 500 ? raw.map(toId) : null;
  if (!moduleIds || moduleIds.some((id) => id === null)) return bad("Choose at least one subject with a module.");

  return { ok: true, value: { count, difficulty: data.difficulty, source: data.source, qbank, moduleIds: [...new Set(moduleIds as number[])] } };
}

// POST /api/student/custom-modules  ->  picks the questions, saves the module, and tells its id
export async function createCustomModuleHandler(req: Request, res: Response): Promise<void> {
  const parsed = parseRequest(req.body);
  if (!parsed.ok) {
    res.status(400).json({ success: false, message: parsed.message });
    return;
  }
  try {
    const made = await createCustomModule(studentIdOf(res), parsed.value);
    if (!made) {
      res.status(400).json({ success: false, message: parsed.value.source === "bookmarked" ? "You have no bookmarked questions in the chosen modules." : "No questions match your choices. Try other subjects, modules or settings." });
      return;
    }
    res.status(201).json({ success: true, message: "Custom module ready", data: { module: made } });
  } catch (error) {
    console.error("Create custom module failed:", error);
    res.status(500).json(FAILED);
  }
}

// GET /api/student/custom-modules/:id  ->  the questions (without answers) of one of the student's own modules
export async function getCustomModuleHandler(req: Request, res: Response): Promise<void> {
  const id = toId(req.params.id);
  try {
    const module = id === null ? null : await getCustomModule(studentIdOf(res), id);
    if (!module) {
      res.status(404).json({ success: false, message: "Custom module not found" });
      return;
    }
    res.json({ success: true, message: "Custom module", data: { module: { id: module.id, title: module.title }, questions: module.questions } });
  } catch (error) {
    console.error("Get custom module failed:", error);
    res.status(500).json(FAILED);
  }
}
