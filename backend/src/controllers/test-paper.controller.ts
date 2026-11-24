import type { Request, Response } from "express";
import { OPTION_KEYS, type OptionKey } from "../services/question.service";
import { imageExists, isImageToken } from "../services/image.service";
import { listSections } from "../services/test-section.service";
import { cleanRich, plainLength } from "../services/rich-text.service";
import {
  addPaperQuestions,
  deletePaperQuestion,
  hasAttempts,
  listPaperQuestions,
  reorderPaperQuestions,
  replacePaperQuestion,
  testExists,
  type PaperQuestionInput,
} from "../services/test-paper.service";

// The questions written inside one test of the Test Series. They are separate from the QBank questions.
const NOT_FOUND = { success: false, message: "Test not found" };
const QUESTION_NOT_FOUND = { success: false, message: "Question not found in this test" };
const LOCKED = { success: false, message: "Students have already taken this test, so its questions can no longer be changed." };
const FAILED = { success: false, message: "Something went wrong" };

const MAX_AT_ONCE = 500;

function toId(raw: unknown): number | null {
  const id = typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : typeof raw === "number" ? raw : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

type Parsed = { ok: true; value: PaperQuestionInput } | { ok: false; message: string };

// Checks one question completely: the text, four options, the type and the right answer(s). "label" tells which
// question it is when several are sent together ("Question 3: ...").
function parseQuestion(body: unknown, label = ""): Parsed {
  const bad = (message: string): Parsed => ({ ok: false, message: `${label}${message}` });
  if (typeof body !== "object" || body === null) return bad("Send the question as JSON");
  const data = body as Record<string, unknown>;

  const text = typeof data.text === "string" ? data.text.trim() : "";
  if (!text) return bad("Write the question");
  if (text.length > 5000) return bad("The question must be 5000 characters or fewer");

  const type = data.type === undefined ? "single" : data.type;
  if (type !== "single" && type !== "multiple") return bad("Question type must be single or multiple");

  const rawOptions = (typeof data.options === "object" && data.options !== null ? data.options : {}) as Record<string, unknown>;
  const options = {} as Record<OptionKey, string>;
  for (const key of OPTION_KEYS) {
    // An option may be HTML from the editor: it is cleaned, and the limit counts the words
    const raw = typeof rawOptions[key] === "string" ? (rawOptions[key] as string) : "";
    const option = cleanRich(raw);
    if (!option) return bad(`Write option ${key}`);
    if (plainLength(option) > 500 || option.length > 40000) return bad(`Option ${key} must be 500 characters or fewer`);
    options[key] = option;
  }

  const rawCorrect = data.correct;
  if (!Array.isArray(rawCorrect) || !rawCorrect.every((letter) => (OPTION_KEYS as readonly unknown[]).includes(letter))) {
    return bad("Choose the right answer");
  }
  const correct = [...new Set(rawCorrect as OptionKey[])].sort();
  if (type === "single" && correct.length !== 1) return bad("A single-answer question has exactly one right option");
  if (type === "multiple" && correct.length < 2) return bad("A multiple-answer question needs at least two right options");

  const explanation = data.explanation === undefined ? "" : data.explanation;
  if (typeof explanation !== "string" || plainLength(explanation) > 10000 || explanation.length > 60000) return bad("The explanation must be 10000 characters or fewer");
  const reference = data.reference === undefined ? "" : data.reference;
  if (typeof reference !== "string" || reference.trim().length > 255) return bad("The reference must be 255 characters or fewer");

  // The picture of the question: uploaded first (POST /api/admin/images), then its token comes here
  const imageName = data.imageName === undefined ? "" : data.imageName;
  if (typeof imageName !== "string" || imageName.trim().length > 255) return bad("The image name must be 255 characters or fewer");
  let imageToken: string | null = null;
  if (data.imageToken !== undefined && data.imageToken !== null && data.imageToken !== "") {
    if (!isImageToken(data.imageToken)) return bad("The image is not valid. Upload it again.");
    imageToken = data.imageToken;
  }

  // The part of the test (Part A, Part B ...) the question is in. Checked against the parts of this test later (placeInParts).
  let sectionId: number | null = null;
  if (data.sectionId !== undefined && data.sectionId !== null && data.sectionId !== "") {
    const id = toId(data.sectionId);
    if (id === null) return bad("Choose a part of this test.");
    sectionId = id;
  }

  return { ok: true, value: { text, type, options, correct, explanation: cleanRich(explanation), reference: reference.trim(), imageName: imageToken ? imageName.trim() : "", imageToken, sectionId } };
}

// A test with parts: every question must be in one of them (a question with no part goes to the first part).
// A test with no parts: questions have no part. Returns the message when a question names a part that is not in this test.
async function placeInParts(testId: number, questions: PaperQuestionInput[]): Promise<string | null> {
  const sections = await listSections(testId);
  const ids = new Set(sections.map((section) => section.id));
  for (const [index, question] of questions.entries()) {
    if (sections.length === 0) question.sectionId = null;
    else if (question.sectionId === null) question.sectionId = sections[0].id;
    else if (!ids.has(question.sectionId)) return `${questions.length > 1 ? `Question ${index + 1}: ` : ""}Choose a part of this test.`;
  }
  return null;
}

// The pictures must have been uploaded first. Returns the message when one was not, or null when all are there.
async function missingImage(questions: PaperQuestionInput[]): Promise<string | null> {
  for (const [index, question] of questions.entries()) {
    if (question.imageToken !== null && !(await imageExists(question.imageToken))) {
      return `${questions.length > 1 ? `Question ${index + 1}: ` : ""}The image was not found. Upload it again.`;
    }
  }
  return null;
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

// GET /api/admin/tests/:id/questions
export async function listPaperQuestionsHandler(req: Request, res: Response): Promise<void> {
  try {
    const testId = await openTest(req, res, false);
    if (testId === null) return;
    res.json({ success: true, message: "Questions", data: { questions: await listPaperQuestions(testId) } });
  } catch (error) {
    console.error("List test questions failed:", error);
    res.status(500).json(FAILED);
  }
}

// POST /api/admin/tests/:id/questions
// Body: one question, or { "questions": [ ... ] } to add many (an import). Nothing is added unless every question is valid.
export async function addPaperQuestionsHandler(req: Request, res: Response): Promise<void> {
  try {
    const testId = await openTest(req, res, true);
    if (testId === null) return;

    const body = req.body as { questions?: unknown } | null;
    const many = body !== null && typeof body === "object" && Array.isArray(body.questions);
    const list = many ? (body as { questions: unknown[] }).questions : [req.body];
    if (list.length === 0 || list.length > MAX_AT_ONCE) {
      res.status(400).json({ success: false, message: `Send between 1 and ${MAX_AT_ONCE} questions at a time.` });
      return;
    }
    const questions: PaperQuestionInput[] = [];
    for (const [index, item] of list.entries()) {
      const parsed = parseQuestion(item, many ? `Question ${index + 1}: ` : "");
      if (!parsed.ok) {
        res.status(400).json({ success: false, message: parsed.message });
        return;
      }
      questions.push(parsed.value);
    }
    const misplaced = await placeInParts(testId, questions);
    if (misplaced) {
      res.status(400).json({ success: false, message: misplaced });
      return;
    }
    const lost = await missingImage(questions);
    if (lost) {
      res.status(400).json({ success: false, message: lost });
      return;
    }
    const added = await addPaperQuestions(testId, questions);
    res.status(201).json({ success: true, message: "Questions added", data: { added, questions: await listPaperQuestions(testId) } });
  } catch (error) {
    console.error("Add test questions failed:", error);
    res.status(500).json(FAILED);
  }
}

// PATCH /api/admin/tests/:id/questions/:questionId  (send the whole question)
export async function updatePaperQuestionHandler(req: Request, res: Response): Promise<void> {
  try {
    const testId = await openTest(req, res, true);
    if (testId === null) return;
    const questionId = toId(req.params.questionId);
    const parsed = parseQuestion(req.body);
    if (!parsed.ok) {
      res.status(400).json({ success: false, message: parsed.message });
      return;
    }
    const misplaced = await placeInParts(testId, [parsed.value]);
    if (misplaced) {
      res.status(400).json({ success: false, message: misplaced });
      return;
    }
    const lost = await missingImage([parsed.value]);
    if (lost) {
      res.status(400).json({ success: false, message: lost });
      return;
    }
    if (questionId === null || !(await replacePaperQuestion(testId, questionId, parsed.value))) {
      res.status(404).json(QUESTION_NOT_FOUND);
      return;
    }
    res.json({ success: true, message: "Question updated", data: { questions: await listPaperQuestions(testId) } });
  } catch (error) {
    console.error("Update test question failed:", error);
    res.status(500).json(FAILED);
  }
}

// DELETE /api/admin/tests/:id/questions/:questionId
export async function deletePaperQuestionHandler(req: Request, res: Response): Promise<void> {
  try {
    const testId = await openTest(req, res, true);
    if (testId === null) return;
    const questionId = toId(req.params.questionId);
    if (questionId === null || !(await deletePaperQuestion(testId, questionId))) {
      res.status(404).json(QUESTION_NOT_FOUND);
      return;
    }
    res.json({ success: true, message: "Question deleted", data: { questions: await listPaperQuestions(testId) } });
  } catch (error) {
    console.error("Delete test question failed:", error);
    res.status(500).json(FAILED);
  }
}

// PUT /api/admin/tests/:id/questions-order   body: { "ids": [12, 10, 11] }  (every question of the test, in the new order)
export async function reorderPaperQuestionsHandler(req: Request, res: Response): Promise<void> {
  try {
    const testId = await openTest(req, res, true);
    if (testId === null) return;
    const raw = (req.body as { ids?: unknown } | null)?.ids;
    const ids = Array.isArray(raw) ? raw.map(toId) : null;
    if (ids === null || ids.some((id) => id === null)) {
      res.status(400).json({ success: false, message: "Send the ids of all the questions in the new order." });
      return;
    }
    if (!(await reorderPaperQuestions(testId, ids as number[]))) {
      res.status(400).json({ success: false, message: "The list must have every question of the test, once." });
      return;
    }
    res.json({ success: true, message: "Order saved", data: { questions: await listPaperQuestions(testId) } });
  } catch (error) {
    console.error("Reorder test questions failed:", error);
    res.status(500).json(FAILED);
  }
}
