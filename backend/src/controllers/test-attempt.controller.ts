import type { Request, Response } from "express";
import { OPTION_KEYS, type OptionKey } from "../services/question.service";
import { getAttempt, saveAttemptAnswer, startAttempt, submitAttempt } from "../services/test-attempt.service";

const FAILED = { success: false, message: "Something went wrong" };
const NOT_FOUND = { success: false, message: "Attempt not found" };

// "12" -> 12; anything else -> null
function toId(raw: unknown): number | null {
  const id = typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

const studentIdOf = (res: Response) => (res.locals.student as { id: number }).id;

// POST /api/student/tests/:id/attempt  ->  starts the test, or gives back the attempt that is already there
export async function startAttemptHandler(req: Request, res: Response): Promise<void> {
  const testId = toId(req.params.id);
  if (testId === null) {
    res.status(404).json({ success: false, message: "Test not found" });
    return;
  }
  try {
    const outcome = await startAttempt(testId, studentIdOf(res));
    if (!outcome.ok) res.status(outcome.status).json({ success: false, message: outcome.message });
    else res.json({ success: true, message: "Attempt", data: { attempt: outcome.attempt } });
  } catch (error) {
    console.error("Start attempt failed:", error);
    res.status(500).json(FAILED);
  }
}

// GET /api/student/attempts/:id
export async function getAttemptHandler(req: Request, res: Response): Promise<void> {
  const id = toId(req.params.id);
  try {
    const attempt = id === null ? null : await getAttempt(id, studentIdOf(res));
    if (!attempt) res.status(404).json(NOT_FOUND);
    else res.json({ success: true, message: "Attempt", data: { attempt } });
  } catch (error) {
    console.error("Get attempt failed:", error);
    res.status(500).json(FAILED);
  }
}

// PUT /api/student/attempts/:id/answers/:questionId   body: { "selected": ["B"], "marked": false }
export async function saveAnswerHandler(req: Request, res: Response): Promise<void> {
  const attemptId = toId(req.params.id);
  const questionId = toId(req.params.questionId);
  const body = (typeof req.body === "object" && req.body !== null ? req.body : {}) as { selected?: unknown; marked?: unknown };
  const raw = body.selected;
  const valid = Array.isArray(raw) && raw.length <= OPTION_KEYS.length && raw.every((letter) => (OPTION_KEYS as readonly unknown[]).includes(letter));
  if (attemptId === null || questionId === null || !valid || typeof body.marked !== "boolean") {
    res.status(400).json({ success: false, message: "Send the chosen options (A to D) and whether the question is marked." });
    return;
  }
  try {
    const outcome = await saveAttemptAnswer(attemptId, studentIdOf(res), questionId, [...new Set(raw as OptionKey[])].sort(), body.marked);
    if (!outcome.ok) res.status(outcome.status).json({ success: false, message: outcome.message });
    else res.json({ success: true, message: "Saved" });
  } catch (error) {
    console.error("Save attempt answer failed:", error);
    res.status(500).json(FAILED);
  }
}

// POST /api/student/attempts/:id/submit  ->  grades the test and gives the result
export async function submitAttemptHandler(req: Request, res: Response): Promise<void> {
  const id = toId(req.params.id);
  try {
    const attempt = id === null ? null : await submitAttempt(id, studentIdOf(res));
    if (!attempt) res.status(404).json(NOT_FOUND);
    else res.json({ success: true, message: "Test submitted", data: { attempt } });
  } catch (error) {
    console.error("Submit attempt failed:", error);
    res.status(500).json(FAILED);
  }
}
