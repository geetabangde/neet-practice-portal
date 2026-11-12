import { apiRequest, type ApiResult } from "@/lib/api";
import type { Question } from "@/types";

// What the backend sends: the same question, but with numeric ids (and null while a draft has no subject or topic)
interface ApiQuestion extends Omit<Question, "id" | "subjectId" | "topicId"> {
  id: number;
  subjectId: number | null;
  topicId: number | null;
}

// The admin panel keeps ids as strings, and "" means "not chosen yet". Convert once, here.
function toQuestion(question: ApiQuestion): Question {
  return {
    ...question,
    id: String(question.id),
    subjectId: question.subjectId === null ? "" : String(question.subjectId),
    topicId: question.topicId === null ? "" : String(question.topicId),
  };
}

// What the form sends. createdAt is set by the database.
export type QuestionFields = Omit<Question, "id" | "createdAt">;

function toApiBody(fields: QuestionFields) {
  return { ...fields, subjectId: fields.subjectId || null, topicId: fields.topicId || null };
}

async function mapQuestion(request: Promise<ApiResult<{ question: ApiQuestion }>>): Promise<ApiResult<Question>> {
  const result = await request;
  return result.ok ? { ok: true, data: toQuestion(result.data.question) } : result;
}

export async function fetchQuestions(): Promise<ApiResult<Question[]>> {
  const result = await apiRequest<{ questions: ApiQuestion[] }>("/api/admin/questions");
  return result.ok ? { ok: true, data: result.data.questions.map(toQuestion) } : result;
}

export function createQuestion(fields: QuestionFields): Promise<ApiResult<Question>> {
  return mapQuestion(apiRequest("/api/admin/questions", { method: "POST", body: toApiBody(fields) }));
}

// The form always sends the whole question, so an edit replaces every field
export function updateQuestion(id: string, fields: QuestionFields): Promise<ApiResult<Question>> {
  return mapQuestion(apiRequest(`/api/admin/questions/${id}`, { method: "PATCH", body: toApiBody(fields) }));
}

export function deleteQuestion(id: string): Promise<ApiResult<null>> {
  return apiRequest<null>(`/api/admin/questions/${id}`, { method: "DELETE" });
}
