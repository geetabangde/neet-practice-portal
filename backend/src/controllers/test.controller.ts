import type { Request, Response } from "express";
import {
  countPublishedQuestions,
  createTest,
  deleteTest,
  getTest,
  isMissingReference,
  listTests,
  replaceTest,
  subjectsOfTopics,
  type MockTest,
  type MockTestInput,
  type TestStatus,
} from "../services/test.service";

type Parsed = { ok: true; value: Partial<MockTestInput> } | { ok: false; message: string };

const bad = (message: string): Parsed => ({ ok: false, message });

const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const MAX_SUBJECTS = 200;
const MAX_TOPICS = 1000;
const MAX_QUESTIONS = 1000;

// "12" or 12 -> 12; anything else -> null
function toId(raw: unknown): number | null {
  const id = typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : typeof raw === "number" ? raw : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// A list of ids with no repeats, in the order given. null when anything in it is not an id.
function toIdList(raw: unknown, max: number): number[] | null {
  if (!Array.isArray(raw) || raw.length > max) return null;
  const ids = raw.map(toId);
  if (ids.some((id) => id === null)) return null;
  return [...new Set(ids as number[])];
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
// (end after start, topics inside the subjects ...) are in problemWith.
function parseFields(body: unknown): Parsed {
  if (typeof body !== "object" || body === null) return bad("Send the test details as JSON");
  const data = body as Record<string, unknown>;
  const value: Partial<MockTestInput> = {};

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
  if (data.negativeMarking !== undefined) {
    const marks = toMoney(data.negativeMarking, true);
    if (marks === null) return bad("Negative marking must be 0 or more (up to 2 decimals)");
    value.negativeMarking = marks;
  }
  for (const key of ["startAt", "endAt"] as const) {
    if (data[key] === undefined) continue;
    if (typeof data[key] !== "string" || !isRealDateTime(data[key])) {
      return bad(`${key === "startAt" ? "Start" : "End"} must be a date and time like 2026-11-20T09:30`);
    }
    value[key] = data[key];
  }
  const lists = [
    ["subjectIds", MAX_SUBJECTS, "subjects"],
    ["topicIds", MAX_TOPICS, "topics"],
    ["questionIds", MAX_QUESTIONS, "questions"],
  ] as const;
  for (const [key, max, label] of lists) {
    if (data[key] === undefined) continue;
    const ids = toIdList(data[key], max);
    if (ids === null) return bad(`The list of ${label} is not valid`);
    value[key] = ids;
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
const NO_REFERENCE = { success: false, message: "A chosen subject, topic or question does not exist" };
const FAILED = { success: false, message: "Something went wrong" };

// The rules for a finished test, the same ones the admin wizard applies. Returns a message, or null when fine.
async function problemWith(test: Partial<MockTestInput>, alreadyPublishedQuestionIds: number[]): Promise<string | null> {
  if (!test.title) return "Give the test a title";
  if (test.durationMinutes === undefined) return "Enter the duration in minutes";
  if (test.marksPerQuestion === undefined) return "Enter the marks for each question";
  if (!test.startAt) return "Choose when the test starts";
  if (!test.endAt) return "Choose when the test ends";
  if (test.endAt <= test.startAt) return "The end must be after the start";
  if (!test.subjectIds || test.subjectIds.length === 0) return "Choose at least one subject";
  if (!test.topicIds || test.topicIds.length === 0) return "Choose at least one topic";
  if (!test.questionIds || test.questionIds.length === 0) return "Select at least one question";
  if (test.negativeMarking !== undefined && test.negativeMarking > test.marksPerQuestion) {
    return "Negative marking cannot be more than the marks for a correct answer";
  }

  // Every topic must belong to one of the chosen subjects
  const owners = await subjectsOfTopics(test.topicIds);
  for (const topicId of test.topicIds) {
    const owner = owners.get(topicId);
    if (owner !== undefined && !test.subjectIds.includes(owner)) return "A chosen topic does not belong to the chosen subjects";
  }

  // A published test may only hold published questions. Questions that were already in it are not
  // re-checked, so a question that was later unpublished does not block marking the test completed.
  if (test.status === "published") {
    const toCheck = test.questionIds.filter((id) => !alreadyPublishedQuestionIds.includes(id));
    if ((await countPublishedQuestions(toCheck)) !== toCheck.length) {
      return "A published test can only contain published questions";
    }
  }
  return null;
}

const DEFAULTS = { description: "", negativeMarking: 0, status: "draft" as TestStatus };

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

export async function createTestHandler(req: Request, res: Response): Promise<void> {
  const parsed = parseFields(req.body);
  if (!parsed.ok) {
    res.status(400).json({ success: false, message: parsed.message });
    return;
  }
  const test = { ...DEFAULTS, ...parsed.value };
  try {
    const problem = await problemWith(test, []);
    if (problem) {
      res.status(400).json({ success: false, message: problem });
      return;
    }
    res.status(201).json({ success: true, message: "Test created", data: { test: await createTest(test as MockTestInput) } });
  } catch (error) {
    if (isMissingReference(error)) {
      res.status(400).json(NO_REFERENCE);
      return;
    }
    console.error("Create test failed:", error);
    res.status(500).json(FAILED);
  }
}

// PATCH: send only the fields that change. They are merged into the saved test, and the merged
// result must pass the same rules as a new test.
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
    const { id: _id, ...currentFields } = current;
    const merged: MockTestInput = { ...currentFields, ...parsed.value };

    // Questions already in a published test are trusted; everything else is checked
    const trusted = current.status === "published" && merged.status === "published" ? current.questionIds : [];
    const problem = await problemWith(merged, trusted);
    if (problem) {
      res.status(400).json({ success: false, message: problem });
      return;
    }
    await replaceTest(id, merged);
    res.json({ success: true, message: "Test updated", data: { test: await getTest(id) } });
  } catch (error) {
    if (isMissingReference(error)) {
      res.status(400).json(NO_REFERENCE);
      return;
    }
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
