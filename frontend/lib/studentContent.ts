// What a signed-in student can read from the backend: subjects, and inside them modules and topics.
// The order is subject > module > topic.

import { API_URL, apiDelete, apiGet, apiPost, apiPut, type ApiResult } from "@/lib/api";

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
  durationMinutes: number;
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
  // Token of the question's image, or null when it has none. The picture is at questionImageUrl(token).
  imageToken: string | null;
  // Has this student bookmarked the question?
  bookmarked: boolean;
}

// Where the picture of a question is shown from. It needs no login, so a plain <img> can load it.
export const questionImageUrl = (token: string): string => `${API_URL}/api/images/${token}`;

export interface PracticeTopic {
  id: number;
  name: string;
  moduleName: string;
  subjectName: string;
  subjectSlug: string;
  durationMinutes: number;
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
  // Mini and Subject tests are locked until the student has a paid plan
  locked: boolean;
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

// A part of the test (Part A, Part B ...). The parts run one after the other, each for its own time: the student cannot go to
// the next part until the time of the part he is in runs out, and cannot go back to a part that is over.
export interface AttemptSection {
  id: number;
  name: string;
  instructions: string;
  durationMinutes: number;
  questionCount: number;
  status: "finished" | "current" | "upcoming";
  // Seconds left in the part that is running (0 for the others)
  secondsLeft: number;
  // Seconds until an upcoming part starts (0 for the others)
  startsInSeconds: number;
}

export interface TestAttemptData {
  id: number;
  testId: number;
  title: string;
  durationMinutes: number;
  marksPerQuestion: number;
  negativeMarking: number;
  negativeRatio?: "1/3" | "1/4";
  status: "running" | "submitted";
  // Counted by the server, so closing the page does not stop the clock
  secondsLeft: number;
  // Empty when the test has no parts: one timer for the whole test
  sections: AttemptSection[];
  // imageToken: the question's picture (questionImageUrl(token)), or null. sectionId: its part, or null.
  questions: { id: number; text: string; type: "single" | "multiple"; options: Record<Letter, string>; imageToken: string | null; sectionId: number | null }[];
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

// The attempt as the server has it now: which part is running and how long it has left
export function fetchTestAttempt(token: string, attemptId: number): Promise<ApiResult<{ attempt: TestAttemptData }>> {
  return apiGet<{ attempt: TestAttemptData }>(`/api/student/attempts/${attemptId}`, token);
}

export function saveTestAnswer(token: string, attemptId: number, questionId: number, answer: SavedTestAnswer): Promise<ApiResult<null>> {
  return apiPut<null>(`/api/student/attempts/${attemptId}/answers/${questionId}`, token, answer);
}

export function submitTestAttempt(token: string, attemptId: number): Promise<ApiResult<{ attempt: TestAttemptData }>> {
  return apiPost<{ attempt: TestAttemptData }>(`/api/student/attempts/${attemptId}/submit`, {}, token);
}

// ---- Plans -----------------------------------------------------------------------------------

export interface CurrentPlan {
  name: string;
  price: number;
  // YYYY-MM-DD, or null when the plan never runs out
  expiresAt: string | null;
  // false once the expiry date has passed
  active: boolean;
}

// The plan the student has now (plan is null when there is none)
export function fetchMyPlan(token: string): Promise<ApiResult<{ plan: CurrentPlan | null }>> {
  return apiGet<{ plan: CurrentPlan | null }>("/api/student/plan", token);
}

// Buys a plan for some months. While payment is in demo mode the server takes no money and activates it at once.
export function purchasePlan(token: string, plan: string, months: number, amount: number): Promise<ApiResult<{ plan: CurrentPlan }>> {
  return apiPost<{ plan: CurrentPlan }>("/api/student/plan/purchase", { plan, months, amount }, token);
}
