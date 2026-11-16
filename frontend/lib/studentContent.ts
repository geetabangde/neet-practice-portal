// What a signed-in student can read from the backend: subjects, and inside them modules and topics.
// The order is subject > module > topic.

import { apiGet, apiPost, type ApiResult } from "@/lib/api";

export interface DashSubject {
  id: number;
  name: string;
  // Used in the address: /dashboard/<slug>
  slug: string;
  description: string;
  // Only active modules and topics count, and only published questions
  moduleCount: number;
  topicCount: number;
  questionCount: number;
  // How many of those questions this student has answered
  answeredCount: number;
}

export interface DashTopic {
  id: number;
  name: string;
  questionCount: number;
  answeredCount: number;
}

export interface DashModule {
  id: number;
  name: string;
  questionCount: number;
  answeredCount: number;
  topics: DashTopic[];
}

export function fetchSubjects(token: string): Promise<ApiResult<{ subjects: DashSubject[] }>> {
  return apiGet<{ subjects: DashSubject[] }>("/api/student/subjects", token);
}

export function fetchSubjectWithModules(token: string, slug: string): Promise<ApiResult<{ subject: DashSubject; modules: DashModule[] }>> {
  return apiGet<{ subject: DashSubject; modules: DashModule[] }>(`/api/student/subjects/${encodeURIComponent(slug)}`, token);
}

// ---- Practice ---------------------------------------------------------------------------

export type Letter = "A" | "B" | "C" | "D";

// A question as the student first sees it. The right answer and the explanation are not here on purpose:
// the server sends them only after an answer was submitted.
export interface PracticeQuestion {
  id: number;
  text: string;
  type: "single" | "multiple";
  options: Record<Letter, string>;
}

export interface PracticeTopic {
  id: number;
  name: string;
  moduleName: string;
  subjectName: string;
  subjectSlug: string;
}

// What the server says after marking an answer
export interface AnswerFeedback {
  isCorrect: boolean;
  correct: Letter[];
  explanation: string;
  reference: string;
  // For each option, the share of students (in percent) who chose it
  percents: Record<Letter, number>;
}

export function fetchTopicQuestions(token: string, topicId: string): Promise<ApiResult<{ topic: PracticeTopic; questions: PracticeQuestion[] }>> {
  return apiGet<{ topic: PracticeTopic; questions: PracticeQuestion[] }>(`/api/student/topics/${encodeURIComponent(topicId)}/questions`, token);
}

// The server marks the answer and saves it
export function submitAnswer(token: string, questionId: number, selected: Letter[]): Promise<ApiResult<AnswerFeedback>> {
  return apiPost<AnswerFeedback>(`/api/student/questions/${questionId}/answer`, { selected }, token);
}
