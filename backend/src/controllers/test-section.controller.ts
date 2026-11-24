import type { Request, Response } from "express";
import { hasAttempts, testExists } from "../services/test-paper.service";
import {
  MAX_TOTAL_MINUTES,
  createSection,
  deleteSection,
  listSections,
  reorderSections,
  updateSection,
  type SectionInput,
} from "../services/test-section.service";
import { getTest } from "../services/test.service";

// The parts (Part A, Part B ...) of one test of the Test Series. Each part has its own timer.
const NOT_FOUND = { success: false, message: "Test not found" };
const LOCKED = { success: false, message: "Students have already taken this test, so its parts can no longer be changed." };
const FAILED = { success: false, message: "Something went wrong" };

function toId(raw: unknown): number | null {
  const id = typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : typeof raw === "number" ? raw : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

type Parsed = { ok: true; value: SectionInput } | { ok: false; message: string };

function parseSection(body: unknown): Parsed {
  const bad = (message: string): Parsed => ({ ok: false, message });
  if (typeof body !== "object" || body === null) return bad("Send the part as JSON");
  const data = body as Record<string, unknown>;

  const name = data.name === undefined || data.name === null ? "" : data.name;
  if (typeof name !== "string" || name.trim().length > 60) return bad("The name of a part must be 60 characters or fewer");

  const minutes = toId(data.durationMinutes);
  if (minutes === null || minutes > MAX_TOTAL_MINUTES) return bad(`The time of a part must be a whole number of minutes, from 1 to ${MAX_TOTAL_MINUTES}`);

  const instructions = data.instructions === undefined || data.instructions === null ? "" : data.instructions;
  if (typeof instructions !== "string" || instructions.trim().length > 1000) return bad("The instructions must be 1000 characters or fewer");

  return { ok: true, value: { name: name.trim(), durationMinutes: minutes, instructions: instructions.trim() } };
}

// Finds the test, and (for changes) refuses when students have already taken it. Sends the answer itself and returns null on a refusal.
async function openTest(req: Request, res: Response, forChange: boolean): Promise<number | null> {
  const testId = toId(req.params.id);
  if (testId === null || !(await testExists(testId))) {
    res.status(404).json(NOT_FOUND);
    return null;
  }
  if (forChange && (await hasAttempts(testId))) {
    res.status(409).json(LOCKED);
    return null;
  }
  return testId;
}

// What every call answers with: the parts, and the duration of the test (the total of the parts)
async function reply(res: Response, testId: number, message: string, status = 200): Promise<void> {
  const [sections, test] = await Promise.all([listSections(testId), getTest(testId)]);
  res.status(status).json({ success: true, message, data: { sections, durationMinutes: test?.durationMinutes ?? 0 } });
}

// GET /api/admin/tests/:id/sections
export async function listSectionsHandler(req: Request, res: Response): Promise<void> {
  try {
    const testId = await openTest(req, res, false);
    if (testId === null) return;
    await reply(res, testId, "Parts");
  } catch (error) {
    console.error("List parts failed:", error);
    res.status(500).json(FAILED);
  }
}

// POST /api/admin/tests/:id/sections   body: { "name": "Part A", "durationMinutes": 60, "instructions": "..." }
export async function createSectionHandler(req: Request, res: Response): Promise<void> {
  try {
    const testId = await openTest(req, res, true);
    if (testId === null) return;
    const parsed = parseSection(req.body);
    if (!parsed.ok) {
      res.status(400).json({ success: false, message: parsed.message });
      return;
    }
    const outcome = await createSection(testId, parsed.value);
    if (!outcome.ok) res.status(outcome.status).json({ success: false, message: outcome.message });
    else await reply(res, testId, "Part added", 201);
  } catch (error) {
    console.error("Add part failed:", error);
    res.status(500).json(FAILED);
  }
}

// PATCH /api/admin/tests/:id/sections/:sectionId   (send the whole part)
export async function updateSectionHandler(req: Request, res: Response): Promise<void> {
  try {
    const testId = await openTest(req, res, true);
    if (testId === null) return;
    const parsed = parseSection(req.body);
    if (!parsed.ok) {
      res.status(400).json({ success: false, message: parsed.message });
      return;
    }
    const sectionId = toId(req.params.sectionId);
    if (sectionId === null) {
      res.status(404).json({ success: false, message: "Part not found in this test" });
      return;
    }
    const outcome = await updateSection(testId, sectionId, parsed.value);
    if (!outcome.ok) res.status(outcome.status).json({ success: false, message: outcome.message });
    else await reply(res, testId, "Part saved");
  } catch (error) {
    console.error("Update part failed:", error);
    res.status(500).json(FAILED);
  }
}

// DELETE /api/admin/tests/:id/sections/:sectionId  (its questions move to a neighbouring part)
export async function deleteSectionHandler(req: Request, res: Response): Promise<void> {
  try {
    const testId = await openTest(req, res, true);
    if (testId === null) return;
    const sectionId = toId(req.params.sectionId);
    if (sectionId === null) {
      res.status(404).json({ success: false, message: "Part not found in this test" });
      return;
    }
    const outcome = await deleteSection(testId, sectionId);
    if (!outcome.ok) res.status(outcome.status).json({ success: false, message: outcome.message });
    else await reply(res, testId, "Part deleted");
  } catch (error) {
    console.error("Delete part failed:", error);
    res.status(500).json(FAILED);
  }
}

// PUT /api/admin/tests/:id/sections-order   body: { "ids": [5, 4, 6] }  (every part of the test, in the new order)
export async function reorderSectionsHandler(req: Request, res: Response): Promise<void> {
  try {
    const testId = await openTest(req, res, true);
    if (testId === null) return;
    const raw = (req.body as { ids?: unknown } | null)?.ids;
    const ids = Array.isArray(raw) ? raw.map(toId) : null;
    if (ids === null || ids.some((id) => id === null)) {
      res.status(400).json({ success: false, message: "Send the ids of all the parts in the new order." });
      return;
    }
    if (!(await reorderSections(testId, ids as number[]))) {
      res.status(400).json({ success: false, message: "The list must have every part of the test, once." });
      return;
    }
    await reply(res, testId, "Order saved");
  } catch (error) {
    console.error("Reorder parts failed:", error);
    res.status(500).json(FAILED);
  }
}
