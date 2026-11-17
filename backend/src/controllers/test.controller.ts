import type { Request, Response } from "express";
import {
  countPublishedQuestions,
  createTest,
  deleteTest,
  getTest,
  isMissingReference,
  listTests,
  replaceTest,
  scopeOfQuestions,
  type MockTest,
  type MockTestInput,
  type TestKind,
  type TestPattern,
  type TestStatus,
} from "../services/test.service";

// What the admin may send. A test is made from its basics; its questions are added later (PATCH questionIds).
// The subjects and topics of a test are not sent: they are worked out from its questions.
type Fields = Partial<Omit<MockTestInput, "subjectIds" | "topicIds">>;
type Parsed = { ok: true; value: Fields } | { ok: false; message: string };

const bad = (message: string): Parsed => ({ ok: false, message });

const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
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
  if (data.questionIds !== undefined) {
    const ids = toIdList(data.questionIds, MAX_QUESTIONS);
    if (ids === null) return bad(`The list of questions is not valid (at most ${MAX_QUESTIONS})`);
    value.questionIds = ids;
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
const NO_REFERENCE = { success: false, message: "A chosen question does not exist" };
const FAILED = { success: false, message: "Something went wrong" };

type Prepared = { ok: true; input: MockTestInput } | { ok: false; message: string };

// Applies the rules to a finished test (the saved test with the changes merged in) and fills in its subjects
// and topics from its questions. "trusted" are questions that were already in a published test: they are not
// re-checked, so a question that was later unpublished does not block marking the test completed.
async function prepare(test: Fields, trusted: number[]): Promise<Prepared> {
  if (!test.title) return { ok: false, message: "Give the test a title" };
  if (test.durationMinutes === undefined) return { ok: false, message: "Enter the duration in minutes" };
  if (test.marksPerQuestion === undefined) return { ok: false, message: "Enter the marks for each question" };
  if (!test.startAt) return { ok: false, message: "Choose when the test starts" };
  if (!test.endAt) return { ok: false, message: "Choose when the test ends" };
  if (test.endAt <= test.startAt) return { ok: false, message: "The end must be after the start" };
  const negativeMarking = test.negativeMarking ?? 0;
  if (negativeMarking > test.marksPerQuestion) return { ok: false, message: "Negative marking cannot be more than the marks for a correct answer" };

  const questionIds = test.questionIds ?? [];
  const status = test.status ?? "draft";

  const scope = await scopeOfQuestions(questionIds);
  if (scope.found !== questionIds.length) return { ok: false, message: NO_REFERENCE.message };

  if (status === "published") {
    if (questionIds.length === 0) return { ok: false, message: "Add at least one question before publishing the test" };
    const toCheck = questionIds.filter((id) => !trusted.includes(id));
    if ((await countPublishedQuestions(toCheck)) !== toCheck.length) {
      return { ok: false, message: "A published test can only contain published questions" };
    }
  }

  return {
    ok: true,
    input: {
      title: test.title,
      description: test.description ?? "",
      kind: test.kind ?? "grand",
      pattern: test.pattern ?? "NEET",
      subjectIds: scope.subjectIds,
      topicIds: scope.topicIds,
      questionIds,
      durationMinutes: test.durationMinutes,
      marksPerQuestion: test.marksPerQuestion,
      negativeMarking,
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
    const prepared = await prepare(parsed.value, []);
    if (!prepared.ok) {
      res.status(400).json({ success: false, message: prepared.message });
      return;
    }
    res.status(201).json({ success: true, message: "Test created", data: { test: await createTest(prepared.input) } });
  } catch (error) {
    if (isMissingReference(error)) {
      res.status(400).json(NO_REFERENCE);
      return;
    }
    console.error("Create test failed:", error);
    res.status(500).json(FAILED);
  }
}

// PATCH: send only the fields that change (including questionIds, the full new list of questions). They are
// merged into the saved test, and the merged result must pass the same rules as a new test.
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
    const { id: _id, subjectIds: _subjects, topicIds: _topics, ...currentFields } = current;
    const merged: Fields = { ...currentFields, ...parsed.value };

    const trusted = current.status === "published" && merged.status === "published" ? current.questionIds : [];
    const prepared = await prepare(merged, trusted);
    if (!prepared.ok) {
      res.status(400).json({ success: false, message: prepared.message });
      return;
    }
    await replaceTest(id, prepared.input);
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
