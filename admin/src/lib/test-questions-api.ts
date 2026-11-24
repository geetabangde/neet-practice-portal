import { apiRequest, type ApiResult } from "@/lib/api";
import type { OptionKey, QuestionType } from "@/types";

// A question written inside a test of the Test Series. It belongs to that one test: it is not a QBank question
// and has no subject, module or topic.
export interface TestQuestion {
  id: string;
  // 1, 2, 3 ... the order in the test
  position: number;
  text: string;
  type: QuestionType;
  options: Record<OptionKey, string>;
  // One letter for "single", two or more for "multiple"
  correct: OptionKey[];
  explanation: string;
  reference: string;
  // The name of the file the admin chose, and the token of the saved picture (shown at /api/images/<token>), or null
  imageName: string;
  imageToken: string | null;
  // The part (Part A, Part B ...) the question is in, or null when the test has no parts
  sectionId: string | null;
}

export type TestQuestionFields = Omit<TestQuestion, "id" | "position">;

interface ApiQuestion extends Omit<TestQuestion, "id" | "sectionId"> {
  id: number;
  sectionId: number | null;
}

const toQuestion = (q: ApiQuestion): TestQuestion => ({ ...q, id: String(q.id), sectionId: q.sectionId === null ? null : String(q.sectionId) });

// Every call that changes the list answers with the whole new list, so the screen always shows what the server has
async function listFrom(request: Promise<ApiResult<{ questions: ApiQuestion[] }>>): Promise<ApiResult<TestQuestion[]>> {
  const result = await request;
  return result.ok ? { ok: true, data: result.data.questions.map(toQuestion) } : result;
}

export function fetchTestQuestions(testId: string): Promise<ApiResult<TestQuestion[]>> {
  return listFrom(apiRequest(`/api/admin/tests/${testId}/questions`));
}

// Adds the questions at the end of the test. Nothing is added unless every question is valid.
export function addTestQuestions(testId: string, questions: TestQuestionFields[]): Promise<ApiResult<TestQuestion[]>> {
  return listFrom(apiRequest(`/api/admin/tests/${testId}/questions`, { method: "POST", body: { questions } }));
}

export function updateTestQuestion(testId: string, questionId: string, fields: TestQuestionFields): Promise<ApiResult<TestQuestion[]>> {
  return listFrom(apiRequest(`/api/admin/tests/${testId}/questions/${questionId}`, { method: "PATCH", body: fields }));
}

export function deleteTestQuestion(testId: string, questionId: string): Promise<ApiResult<TestQuestion[]>> {
  return listFrom(apiRequest(`/api/admin/tests/${testId}/questions/${questionId}`, { method: "DELETE" }));
}

// "ids" holds every question of the test, in the new order
export function reorderTestQuestions(testId: string, ids: string[]): Promise<ApiResult<TestQuestion[]>> {
  return listFrom(apiRequest(`/api/admin/tests/${testId}/questions-order`, { method: "PUT", body: { ids: ids.map(Number) } }));
}
