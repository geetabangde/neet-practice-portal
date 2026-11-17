import type { Request, Response } from "express";
import { OPTION_KEYS, type OptionKey } from "../services/question.service";
import {
  getPracticeTopic,
  getQuestionToMark,
  listPracticeQuestions,
  optionPercents,
  sameOptions,
  saveAnswer,
  type AnswerFeedback,
} from "../services/student-practice.service";

const FAILED = { success: false, message: "Something went wrong" };

// "12" -> 12; anything else -> null
function toId(raw: unknown): number | null {
  const id = typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// GET /api/student/topics/:id/questions  ->  the topic and its published questions (without the answers)
export async function getTopicQuestionsHandler(req: Request, res: Response): Promise<void> {
  const topicId = toId(req.params.id);
  try {
    const topic = topicId === null ? null : await getPracticeTopic(topicId);
    if (!topic) {
      res.status(404).json({ success: false, message: "Topic not found" });
      return;
    }
    res.json({ success: true, message: "Questions", data: { topic, questions: await listPracticeQuestions(topic.id, (res.locals.student as { id: number }).id) } });
  } catch (error) {
    console.error("Get topic questions failed:", error);
    res.status(500).json(FAILED);
  }
}

// POST /api/student/questions/:id/answer   body: { "selected": ["B"] }
// Marks the answer, saves it, and only now tells the student the right option and the explanation.
export async function answerQuestionHandler(req: Request, res: Response): Promise<void> {
  const questionId = toId(req.params.id);
  const body: unknown = req.body;
  const raw = typeof body === "object" && body !== null && "selected" in body ? body.selected : undefined;

  const valid = Array.isArray(raw) && raw.length >= 1 && raw.length <= OPTION_KEYS.length && raw.every((letter) => (OPTION_KEYS as readonly unknown[]).includes(letter));
  if (!valid) {
    res.status(400).json({ success: false, message: "Choose at least one option (A to D)." });
    return;
  }
  const selected = [...new Set(raw as OptionKey[])].sort();

  try {
    const question = questionId === null ? null : await getQuestionToMark(questionId);
    if (!question) {
      res.status(404).json({ success: false, message: "Question not found" });
      return;
    }
    if (question.type === "single" && selected.length !== 1) {
      res.status(400).json({ success: false, message: "Choose only one option for this question." });
      return;
    }

    const studentId = (res.locals.student as { id: number }).id;
    const isCorrect = sameOptions(selected, question.correct);
    await saveAnswer(studentId, question.id, selected, isCorrect);

    const feedback: AnswerFeedback = {
      isCorrect,
      correct: question.correct,
      explanation: question.explanation,
      reference: question.reference,
      percents: await optionPercents(question.id),
    };
    res.json({ success: true, message: isCorrect ? "Correct" : "Incorrect", data: feedback });
  } catch (error) {
    console.error("Answer question failed:", error);
    res.status(500).json(FAILED);
  }
}
