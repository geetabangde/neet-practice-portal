import type { Request, Response } from "express";
import {
  createTest,
  deleteTest,
  getTest,
  listTests,
  NEGATIVE_RATIOS,
  replaceTest,
  type MockTest,
  type MockTestInput,
  type NegativeRatio,
  type TestKind,
  type TestPattern,
  type TestStatus,
} from "../services/test.service";

// What the admin may send. A test is made from its basics; its questions are written afterwards, inside the test
// (see test-paper.controller.ts). The negative marks are not typed: the admin picks 1/3 or 1/4 of the marks.
type Fields = Partial<MockTestInput>;
type Parsed = { ok: true; value: Fields } | { ok: false; message: string };

const bad = (message: string): Parsed => ({ ok: false, message });

const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

// "12" or 12 -> 12; anything else -> null
function toId(raw: unknown): number | null {
  const id = typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : typeof raw === "number" ? raw : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// Real calendar check: "2026-02-31T10:00" has the right shape but is not a date
function isRealDateTime(value: string): boolean {
  if (!DATE_TIME.test(value)) return false;
  const date = new Date(`${value}:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 16) === value;
}

// A positive number with at most two decimals (the table stores DECIMAL(6,2))
function toMoney(raw: unknown, allowZero: boolean): number | null {
  const number = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : raw;
  if (typeof number !== "number" || !Number.isFinite(number)) return null;
  if (number < 0 || (number === 0 && !allowZero) || number > 1000) return null;
  return Math.abs(Math.round(number * 100) - number * 100) < 1e-9 ? number : null;
}

// Checks the type and size of every field that was sent. The rules about the whole test
// (end after start, questions that exist ...) are in prepare.
function parseFields(body: unknown): Parsed {
  if (typeof body !== "object" || body === null) return bad("Send the test details as JSON");
  const data = body as Record<string, unknown>;
  const value: Fields = {};

  if (data.title !== undefined) {
    if (typeof data.title !== "string" || data.title.trim() === "") return bad("Give the test a title");
    if (data.title.trim().length > 200) return bad("The title must be 200 characters or fewer");
    value.title = data.title.trim();
  }
  if (data.description !== undefined) {
    if (typeof data.description !== "string" || data.description.trim().length > 1000) {
      return bad("The description must be 1000 characters or fewer");
    }
    value.description = data.description.trim();
  }
  if (data.kind !== undefined) {
    if (data.kind !== "grand" && data.kind !== "mini" && data.kind !== "subject") return bad("Test type must be grand, mini or subject");
    value.kind = data.kind as TestKind;
  }
  if (data.pattern !== undefined) {
    if (data.pattern !== "NEET" && data.pattern !== "INICET") return bad("Pattern must be NEET or INICET");
    value.pattern = data.pattern as TestPattern;
  }
  if (data.durationMinutes !== undefined) {
    const minutes = toId(data.durationMinutes);
    if (minutes === null || minutes > 1440) return bad("Duration must be a whole number of minutes, from 1 to 1440");
    value.durationMinutes = minutes;
  }
  if (data.marksPerQuestion !== undefined) {
    const marks = toMoney(data.marksPerQuestion, false);
    if (marks === null) return bad("Marks for each question must be more than 0 (up to 2 decimals)");
    value.marksPerQuestion = marks;
  }
  if (data.negativeRatio !== undefined) {
    if (typeof data.negativeRatio !== "string" || !(NEGATIVE_RATIOS as readonly string[]).includes(data.negativeRatio)) {
      return bad("Negative marking must be 1/3 or 1/4 of the marks");
    }
    value.negativeRatio = data.negativeRatio as NegativeRatio;
  }
  for (const key of ["startAt", "endAt"] as const) {
    if (data[key] === undefined) continue;
    if (typeof data[key] !== "string" || !isRealDateTime(data[key])) {
      return bad(`${key === "startAt" ? "Start" : "End"} must be a date and time like 2026-11-20T09:30`);
    }
    value[key] = data[key];
  }
  if (data.status !== undefined) {
    if (data.status !== "draft" && data.status !== "published" && data.status !== "completed") {
      return bad("Status must be draft, published or completed");
    }
    value.status = data.status as TestStatus;
  }
  return { ok: true, value };
}

const NOT_FOUND = { success: false, message: "Test not found" };
const FAILED = { success: false, message: "Something went wrong" };

type Prepared = { ok: true; input: MockTestInput } | { ok: false; message: string };

// Applies the rules to a finished test (the saved test with the changes merged in). "questionCount" is how many questions
// the test has now: a test needs at least one before it can be published or marked completed.
function prepare(test: Fields, questionCount: number): Prepared {
  if (!test.title) return { ok: false, message: "Give the test a title" };
  if (test.durationMinutes === undefined) return { ok: false, message: "Enter the duration in minutes" };
  if (test.marksPerQuestion === undefined) return { ok: false, message: "Enter the marks for each question" };
  if (!test.startAt) return { ok: false, message: "Choose when the test starts" };
  if (!test.endAt) return { ok: false, message: "Choose when the test ends" };
  if (test.endAt <= test.startAt) return { ok: false, message: "The end must be after the start" };

  const status = test.status ?? "draft";
  if (status === "published" && questionCount === 0) return { ok: false, message: "Add at least one question before publishing the test" };

  return {
    ok: true,
    input: {
      title: test.title,
      description: test.description ?? "",
      kind: test.kind ?? "grand",
      pattern: test.pattern ?? "NEET",
      durationMinutes: test.durationMinutes,
      marksPerQuestion: test.marksPerQuestion,
      negativeRatio: test.negativeRatio ?? "1/3",
      startAt: test.startAt,
      endAt: test.endAt,
      status,
    },
  };
}

export async function listTestsHandler(_req: Request, res: Response): Promise<void> {
  try {
    res.json({ success: true, message: "Tests", data: { tests: await listTests() } });
  } catch (error) {
    console.error("List tests failed:", error);
    res.status(500).json(FAILED);
  }
}

export async function getTestHandler(req: Request, res: Response): Promise<void> {
  const id = toId(req.params.id);
  if (id === null) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  try {
    const test = await getTest(id);
    if (!test) res.status(404).json(NOT_FOUND);
    else res.json({ success: true, message: "Test", data: { test } });
  } catch (error) {
    console.error("Get test failed:", error);
    res.status(500).json(FAILED);
  }
}

// Makes a test from its basics. It starts as a draft with no questions; questions are added afterwards.
export async function createTestHandler(req: Request, res: Response): Promise<void> {
  const parsed = parseFields(req.body);
  if (!parsed.ok) {
    res.status(400).json({ success: false, message: parsed.message });
    return;
  }
  try {
    const prepared = prepare(parsed.value, 0);
    if (!prepared.ok) {
      res.status(400).json({ success: false, message: prepared.message });
      return;
    }
    res.status(201).json({ success: true, message: "Test created", data: { test: await createTest(prepared.input) } });
  } catch (error) {
    console.error("Create test failed:", error);
    res.status(500).json(FAILED);
  }
}

// PATCH: send only the fields that change. They are merged into the saved test, and the merged result must pass
// the same rules as a new test.
export async function updateTestHandler(req: Request, res: Response): Promise<void> {
  const id = toId(req.params.id);
  if (id === null) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  const parsed = parseFields(req.body);
  if (!parsed.ok) {
    res.status(400).json({ success: false, message: parsed.message });
    return;
  }
  try {
    const current: MockTest | null = await getTest(id);
    if (!current) {
      res.status(404).json(NOT_FOUND);
      return;
    }
    const { id: _id, questionCount, sectionCount, negativeMarking: _negative, ...currentFields } = current;
    const merged: Fields = { ...currentFields, ...parsed.value };
    // With parts, the duration is the total of the parts and is not typed in
    if (sectionCount > 0) merged.durationMinutes = current.durationMinutes;

    const prepared = prepare(merged, questionCount);
    if (!prepared.ok) {
      res.status(400).json({ success: false, message: prepared.message });
      return;
    }
    await replaceTest(id, prepared.input);
    res.json({ success: true, message: "Test updated", data: { test: await getTest(id) } });
  } catch (error) {
    console.error("Update test failed:", error);
    res.status(500).json(FAILED);
  }
}

export async function deleteTestHandler(req: Request, res: Response): Promise<void> {
  const id = toId(req.params.id);
  if (id === null) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  try {
    const removed = await deleteTest(id);
    if (!removed) res.status(404).json(NOT_FOUND);
    else res.json({ success: true, message: "Test deleted" });
  } catch (error) {
    console.error("Delete test failed:", error);
    res.status(500).json(FAILED);
  }
}
