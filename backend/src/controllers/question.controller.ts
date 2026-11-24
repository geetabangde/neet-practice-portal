import type { Request, Response } from "express";
import {
  OPTION_KEYS,
  createQuestion,
  deleteQuestion,
  findQuestionProblem,
  getQuestion,
  isMissingParent,
  listQuestions,
  replaceQuestion,
  topicBelongsToSubject,
  type Difficulty,
  type OptionKey,
  type QuestionInput,
  type QuestionStatus,
  type QuestionType,
} from "../services/question.service";
import { imageExists, isImageToken } from "../services/image.service";
import { cleanRich, plainLength } from "../services/rich-text.service";

type Parsed = { ok: true; value: Partial<QuestionInput> } | { ok: false; message: string };

const TEXT_LIMIT = 1000;
const OPTION_LIMIT = 500;
const EXPLANATION_LIMIT = 5000;
// The explanation and options may be HTML from the editor: the limits above count the words, this one the whole HTML
const HTML_LIMIT = 40000;

const bad = (message: string): Parsed => ({ ok: false, message });

// "12" or 12 -> 12; anything else -> null
function toId(raw: unknown): number | null {
  const id = typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : typeof raw === "number" ? raw : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// Checks the type and size of every field that was sent. It does not check the "published needs
// everything" rules: those apply to the finished question, see findQuestionProblem.
function parseFields(body: unknown): Parsed {
  if (typeof body !== "object" || body === null) return bad("Send the question details as JSON");
  const data = body as Record<string, unknown>;
  const value: Partial<QuestionInput> = {};

  for (const key of ["subjectId", "topicId"] as const) {
    if (data[key] === undefined) continue;
    if (data[key] === null || data[key] === "") {
      value[key] = null;
      continue;
    }
    const id = toId(data[key]);
    if (id === null) return bad(`${key === "subjectId" ? "Subject" : "Topic"} is not valid`);
    value[key] = id;
  }
  if (data.text !== undefined) {
    if (typeof data.text !== "string" || data.text.trim() === "") return bad("Write the question text");
    if (data.text.trim().length > TEXT_LIMIT) return bad(`Question text must be ${TEXT_LIMIT} characters or fewer`);
    value.text = data.text.trim();
  }
  if (data.difficulty !== undefined) {
    if (data.difficulty !== "easy" && data.difficulty !== "medium" && data.difficulty !== "hard") return bad("Choose a valid difficulty");
    value.difficulty = data.difficulty as Difficulty;
  }
  if (data.type !== undefined) {
    if (data.type !== "single" && data.type !== "multiple") return bad("Question type must be single or multiple");
    value.type = data.type as QuestionType;
  }
  if (data.options !== undefined) {
    const raw = data.options;
    if (typeof raw !== "object" || raw === null) return bad("Send options A, B, C and D");
    const options = {} as Record<OptionKey, string>;
    for (const key of OPTION_KEYS) {
      const option = (raw as Record<string, unknown>)[key];
      if (typeof option !== "string") return bad(`Option ${key} must be text`);
      if (plainLength(option) > OPTION_LIMIT || option.length > HTML_LIMIT) return bad(`Option ${key} must be ${OPTION_LIMIT} characters or fewer`);
      options[key] = cleanRich(option);
    }
    value.options = options;
  }
  if (data.correct !== undefined) {
    const raw = data.correct;
    const valid = Array.isArray(raw) && raw.every((letter) => (OPTION_KEYS as readonly unknown[]).includes(letter));
    if (!valid) return bad("Correct answers must be letters A to D");
    value.correct = [...new Set(raw as OptionKey[])].sort();
  }
  if (data.explanation !== undefined) {
    if (typeof data.explanation !== "string" || plainLength(data.explanation) > EXPLANATION_LIMIT || data.explanation.length > HTML_LIMIT) {
      return bad(`Explanation must be ${EXPLANATION_LIMIT} characters or fewer`);
    }
    value.explanation = cleanRich(data.explanation);
  }
  for (const key of ["reference", "imageName"] as const) {
    if (data[key] === undefined) continue;
    if (typeof data[key] !== "string" || data[key].trim().length > 255) return bad(`${key === "reference" ? "Reference" : "Image name"} must be 255 characters or fewer`);
    value[key] = data[key].trim();
  }
  if (data.imageToken !== undefined) {
    // null or empty: the question has no image
    if (data.imageToken === null || data.imageToken === "") value.imageToken = null;
    else if (isImageToken(data.imageToken)) value.imageToken = data.imageToken;
    else return bad("The image is not valid. Upload it again.");
  }
  if (data.status !== undefined) {
    if (data.status !== "published" && data.status !== "draft") return bad("Status must be published or draft");
    value.status = data.status as QuestionStatus;
  }
  return { ok: true, value };
}

const DEFAULTS: Omit<QuestionInput, "text"> = {
  subjectId: null,
  topicId: null,
  difficulty: "medium",
  type: "single",
  options: { A: "", B: "", C: "", D: "" },
  correct: [],
  explanation: "",
  reference: "",
  imageName: "",
  imageToken: null,
  status: "draft",
};

const NOT_FOUND = { success: false, message: "Question not found" };
const NO_PARENT = { success: false, message: "The chosen subject or topic does not exist" };
const FAILED = { success: false, message: "Something went wrong" };

// Runs every check on a finished question. Returns the error message, or null when it is fine to save.
async function problemWith(q: QuestionInput): Promise<string | null> {
  const incomplete = findQuestionProblem(q);
  if (incomplete) return incomplete;
  if (q.subjectId !== null && q.topicId !== null && !(await topicBelongsToSubject(q.topicId, q.subjectId))) {
    return "The chosen topic does not belong to the chosen subject";
  }
  // The image must have been uploaded first
  if (q.imageToken !== null && !(await imageExists(q.imageToken))) return "The image was not found. Upload it again.";
  return null;
}

export async function listQuestionsHandler(_req: Request, res: Response): Promise<void> {
  try {
    res.json({ success: true, message: "Questions", data: { questions: await listQuestions() } });
  } catch (error) {
    console.error("List questions failed:", error);
    res.status(500).json(FAILED);
  }
}

export async function getQuestionHandler(req: Request, res: Response): Promise<void> {
  const id = toId(req.params.id);
  if (id === null) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  try {
    const question = await getQuestion(id);
    if (!question) res.status(404).json(NOT_FOUND);
    else res.json({ success: true, message: "Question", data: { question } });
  } catch (error) {
    console.error("Get question failed:", error);
    res.status(500).json(FAILED);
  }
}

export async function createQuestionHandler(req: Request, res: Response): Promise<void> {
  const parsed = parseFields(req.body);
  if (!parsed.ok) {
    res.status(400).json({ success: false, message: parsed.message });
    return;
  }
  const question = { ...DEFAULTS, ...parsed.value } as QuestionInput;
  if (typeof question.text !== "string") {
    res.status(400).json({ success: false, message: "Write the question text" });
    return;
  }
  try {
    const problem = await problemWith(question);
    if (problem) {
      res.status(400).json({ success: false, message: problem });
      return;
    }
    res.status(201).json({ success: true, message: "Question created", data: { question: await createQuestion(question) } });
  } catch (error) {
    if (isMissingParent(error)) {
      res.status(400).json(NO_PARENT);
      return;
    }
    console.error("Create question failed:", error);
    res.status(500).json(FAILED);
  }
}

// PATCH: send only the fields that change. They are merged into the saved question, and the
// merged result must pass the same rules as a new question.
export async function updateQuestionHandler(req: Request, res: Response): Promise<void> {
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
    const current = await getQuestion(id);
    if (!current) {
      res.status(404).json(NOT_FOUND);
      return;
    }
    const { id: _id, createdAt: _createdAt, ...currentFields } = current;
    const merged: QuestionInput = { ...currentFields, ...parsed.value };

    // Moving a question to another subject without naming a topic would leave a mismatched topic behind
    if (parsed.value.subjectId !== undefined && parsed.value.topicId === undefined && merged.subjectId !== current.subjectId) {
      merged.topicId = null;
    }

    const problem = await problemWith(merged);
    if (problem) {
      res.status(400).json({ success: false, message: problem });
      return;
    }
    await replaceQuestion(id, merged);
    res.json({ success: true, message: "Question updated", data: { question: await getQuestion(id) } });
  } catch (error) {
    if (isMissingParent(error)) {
      res.status(400).json(NO_PARENT);
      return;
    }
    console.error("Update question failed:", error);
    res.status(500).json(FAILED);
  }
}

export async function deleteQuestionHandler(req: Request, res: Response): Promise<void> {
  const id = toId(req.params.id);
  if (id === null) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  try {
    const removed = await deleteQuestion(id);
    if (!removed) res.status(404).json(NOT_FOUND);
    else res.json({ success: true, message: "Question deleted" });
  } catch (error) {
    console.error("Delete question failed:", error);
    res.status(500).json(FAILED);
  }
}
