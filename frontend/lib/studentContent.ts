// What a signed-in student can read from the backend: subjects, and inside them modules and topics.
// The order is subject > module > topic.

import { apiDelete, apiGet, apiPost, apiPut, type ApiResult } from "@/lib/api";

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
  // Has this student bookmarked the question?
  bookmarked: boolean;
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

// ---- Custom module -------------------------------------------------------------------------

export interface PickerModule {
  id: number;
  name: string;
  // Published questions in it
  questionCount: number;
}

export interface PickerSubject {
  id: number;
  name: string;
  slug: string;
  modules: PickerModule[];
}

export interface CustomModuleRequest {
  count: number;
  difficulty: "easy" | "medium" | "hard";
  source: "all" | "qbank" | "bookmarked";
  // For source "qbank": which of the student's own questions to use
  qbank: { attempted: boolean; incorrect: boolean; unattempted: boolean };
  moduleIds: number[];
}

export interface CustomModuleSummary {
  id: number;
  title: string;
  // The questions the module got
  questionCount: number;
  // The questions that matched the choices. It is less than asked for when there are not enough.
  matching: number;
}

export function fetchCustomOptions(token: string): Promise<ApiResult<{ subjects: PickerSubject[] }>> {
  return apiGet<{ subjects: PickerSubject[] }>("/api/student/custom-module/options", token);
}

// The server picks the questions at random and saves the module
export function createCustomModule(token: string, request: CustomModuleRequest): Promise<ApiResult<{ module: CustomModuleSummary }>> {
  return apiPost<{ module: CustomModuleSummary }>("/api/student/custom-modules", request, token);
}

export function fetchCustomModule(token: string, id: string): Promise<ApiResult<{ module: { id: number; title: string }; questions: PracticeQuestion[] }>> {
  return apiGet<{ module: { id: number; title: string }; questions: PracticeQuestion[] }>(`/api/student/custom-modules/${encodeURIComponent(id)}`, token);
}

// ---- Bookmarks -------------------------------------------------------------------------------

// The bookmarks page shows one card per module that has bookmarked questions
export interface BookmarkGroup {
  moduleId: number;
  moduleName: string;
  subjectId: number;
  subjectName: string;
  subjectSlug: string;
  count: number;
}

export function fetchBookmarks(token: string): Promise<ApiResult<{ bookmarks: BookmarkGroup[] }>> {
  return apiGet<{ bookmarks: BookmarkGroup[] }>("/api/student/bookmarks", token);
}

export function fetchBookmarkedModule(
  token: string,
  moduleId: string,
): Promise<ApiResult<{ module: { id: number; name: string; subjectName: string; subjectSlug: string }; questions: PracticeQuestion[] }>> {
  return apiGet<{ module: { id: number; name: string; subjectName: string; subjectSlug: string }; questions: PracticeQuestion[] }>(
    `/api/student/bookmarks/modules/${encodeURIComponent(moduleId)}`,
    token,
  );
}

export function addBookmark(token: string, questionId: number): Promise<ApiResult<null>> {
  return apiPut<null>(`/api/student/bookmarks/${questionId}`, token);
}

export function removeBookmark(token: string, questionId: number): Promise<ApiResult<null>> {
  return apiDelete<null>(`/api/student/bookmarks/${questionId}`, token);
}

// ---- Test Series -----------------------------------------------------------------------------

export type TestKind = "grand" | "mini" | "subject";

export interface SeriesTest {
  id: number;
  title: string;
  kind: TestKind;
  pattern: "NEET" | "INICET";
  // YYYY-MM-DDTHH:mm, the clock time the admin typed
  startAt: string;
  endAt: string;
  questionCount: number;
  durationMinutes: number;
  status: "published" | "completed";
}

export function fetchSeriesTests(token: string): Promise<ApiResult<{ tests: SeriesTest[] }>> {
  return apiGet<{ tests: SeriesTest[] }>("/api/student/tests", token);
}

// ---- Taking a test ---------------------------------------------------------------------------

export interface SavedTestAnswer {
  selected: Letter[];
  marked: boolean;
}

export interface TestResultData {
  score: number;
  totalMarks: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  total: number;
  // Place among the students who finished the test (1 = best), and how many finished it
  position: number;
  finishedBy: number;
}

export interface TestReviewItem {
  questionId: number;
  selected: Letter[];
  correct: Letter[];
  isCorrect: boolean;
  explanation: string;
  reference: string;
}

export interface TestAttemptData {
  id: number;
  testId: number;
  title: string;
  durationMinutes: number;
  marksPerQuestion: number;
  negativeMarking: number;
  status: "running" | "submitted";
  // Counted by the server, so closing the page does not stop the clock
  secondsLeft: number;
  questions: { id: number; text: string; type: "single" | "multiple"; options: Record<Letter, string> }[];
  // Keyed by question id
  answers: Record<string, SavedTestAnswer>;
  // Only after the test is submitted
  result?: TestResultData;
  review?: TestReviewItem[];
}

// Starts the test, or gives back the attempt that already exists (a reload does not restart the clock)
export function startTestAttempt(token: string, testId: string): Promise<ApiResult<{ attempt: TestAttemptData }>> {
  return apiPost<{ attempt: TestAttemptData }>(`/api/student/tests/${encodeURIComponent(testId)}/attempt`, {}, token);
}

export function saveTestAnswer(token: string, attemptId: number, questionId: number, answer: SavedTestAnswer): Promise<ApiResult<null>> {
  return apiPut<null>(`/api/student/attempts/${attemptId}/answers/${questionId}`, token, answer);
}

export function submitTestAttempt(token: string, attemptId: number): Promise<ApiResult<{ attempt: TestAttemptData }>> {
  return apiPost<{ attempt: TestAttemptData }>(`/api/student/attempts/${attemptId}/submit`, {}, token);
}
