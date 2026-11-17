import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../config/db";
import type { OptionKey, QuestionType } from "./question.service";
import { sameOptions } from "./student-practice.service";

// A student takes a test once. The attempt starts when the student presses "Yes" on the start pop-up and the clock
// runs on the SERVER: the deadline is started_at + the duration of the test, so closing the page or changing the
// clock of the computer does not give extra time. When time is over the attempt is graded with what was saved.
export const CREATE_ATTEMPT_TABLES = [
  `CREATE TABLE IF NOT EXISTS test_attempts (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    test_id      INT UNSIGNED NOT NULL,
    student_id   INT UNSIGNED NOT NULL,
    started_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at DATETIME NULL,
    correct      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    incorrect    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    unattempted  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    score        DECIMAL(8,2) NOT NULL DEFAULT 0,
    total_marks  DECIMAL(8,2) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_attempt_student_test (student_id, test_id),
    KEY idx_attempt_test_score (test_id, score),
    CONSTRAINT fk_attempt_test FOREIGN KEY (test_id) REFERENCES tests (id) ON DELETE CASCADE,
    CONSTRAINT fk_attempt_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  // One row per question the student has touched: the saved options ("" = none) and the review mark
  `CREATE TABLE IF NOT EXISTS test_attempt_answers (
    attempt_id  INT UNSIGNED NOT NULL,
    question_id INT UNSIGNED NOT NULL,
    selected    VARCHAR(7) NOT NULL DEFAULT '',
    marked      TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (attempt_id, question_id),
    CONSTRAINT fk_attempt_answers_attempt FOREIGN KEY (attempt_id) REFERENCES test_attempts (id) ON DELETE CASCADE,
    CONSTRAINT fk_attempt_answers_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

export interface AttemptQuestion {
  id: number;
  text: string;
  type: QuestionType;
  options: Record<OptionKey, string>;
}

export interface SavedAnswer {
  selected: OptionKey[];
  marked: boolean;
}

export interface AttemptResult {
  score: number;
  totalMarks: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  total: number;
  // Place among the students who finished this test (1 = best score), and how many finished it
  position: number;
  finishedBy: number;
}

// Shown only after the attempt is over
export interface ReviewItem {
  questionId: number;
  selected: OptionKey[];
  correct: OptionKey[];
  isCorrect: boolean;
  explanation: string;
  reference: string;
}

export interface Attempt {
  id: number;
  testId: number;
  title: string;
  durationMinutes: number;
  marksPerQuestion: number;
  negativeMarking: number;
  status: "running" | "submitted";
  secondsLeft: number;
  questions: AttemptQuestion[];
  answers: Record<number, SavedAnswer>;
  result?: AttemptResult;
  review?: ReviewItem[];
}

interface AttemptRow extends RowDataPacket {
  id: number;
  testId: number;
  studentId: number;
  title: string;
  durationMinutes: number;
  marksPerQuestion: string;
  negativeMarking: string;
  submitted: number;
  secondsLeft: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  score: string;
  totalMarks: string;
}

const ATTEMPT_SELECT = `SELECT a.id, a.test_id AS testId, a.student_id AS studentId, t.title, t.duration_minutes AS durationMinutes,
    t.marks_per_question AS marksPerQuestion, t.negative_marking AS negativeMarking, (a.submitted_at IS NOT NULL) AS submitted,
    CAST(t.duration_minutes AS SIGNED) * 60 - TIMESTAMPDIFF(SECOND, a.started_at, NOW()) AS secondsLeft,
    a.correct, a.incorrect, a.unattempted, a.score, a.total_marks AS totalMarks
  FROM test_attempts a JOIN tests t ON t.id = a.test_id`;

async function findAttemptRow(where: string, params: unknown[]): Promise<AttemptRow | null> {
  const [rows] = await pool.query<AttemptRow[]>(`${ATTEMPT_SELECT} WHERE ${where} LIMIT 1`, params);
  return rows[0] ?? null;
}

interface QuestionRow extends RowDataPacket {
  id: number;
  text: string;
  type: QuestionType;
  a: string;
  b: string;
  c: string;
  d: string;
  correct: string;
  explanation: string;
  reference: string;
}

// The questions of a test in the order the admin set. Draft questions are skipped.
async function loadQuestions(testId: number): Promise<QuestionRow[]> {
  const [rows] = await pool.query<QuestionRow[]>(
    `SELECT q.id, q.question_text AS text, q.type, q.option_a AS a, q.option_b AS b, q.option_c AS c, q.option_d AS d,
            q.correct, q.explanation, q.reference_text AS reference
       FROM test_questions tq JOIN questions q ON q.id = tq.question_id
      WHERE tq.test_id = ? AND q.status = 'published' ORDER BY tq.position ASC`,
    [testId],
  );
  return rows;
}

const letters = (text: string): OptionKey[] => (text === "" ? [] : (text.split(",") as OptionKey[]));

async function loadAnswers(attemptId: number): Promise<Record<number, SavedAnswer>> {
  const [rows] = await pool.query<(RowDataPacket & { questionId: number; selected: string; marked: number })[]>(
    "SELECT question_id AS questionId, selected, marked FROM test_attempt_answers WHERE attempt_id = ?",
    [attemptId],
  );
  const answers: Record<number, SavedAnswer> = {};
  for (const row of rows) answers[row.questionId] = { selected: letters(row.selected), marked: row.marked === 1 };
  return answers;
}

// Marks the attempt with the saved answers and closes it. Safe to call twice: the second call changes nothing.
async function grade(row: AttemptRow): Promise<void> {
  const questions = await loadQuestions(row.testId);
  const answers = await loadAnswers(row.id);
  const marks = Number(row.marksPerQuestion);
  const negative = Number(row.negativeMarking);
  let correct = 0;
  let incorrect = 0;
  for (const q of questions) {
    const selected = answers[q.id]?.selected ?? [];
    if (selected.length === 0) continue;
    if (sameOptions(selected, letters(q.correct))) correct++;
    else incorrect++;
  }
  const score = Math.round((correct * marks - incorrect * negative) * 100) / 100;
  await pool.query<ResultSetHeader>(
    `UPDATE test_attempts SET submitted_at = NOW(), correct = ?, incorrect = ?, unattempted = ?, score = ?, total_marks = ?
      WHERE id = ? AND submitted_at IS NULL`,
    [correct, incorrect, questions.length - correct - incorrect, score, Math.round(questions.length * marks * 100) / 100, row.id],
  );
}

async function buildAttempt(initial: AttemptRow): Promise<Attempt> {
  let row = initial;
  // Time ran out while the student was away: close it now
  if (row.submitted === 0 && row.secondsLeft <= 0) {
    await grade(row);
    row = (await findAttemptRow("a.id = ?", [row.id])) ?? row;
  }
  const finished = row.submitted === 1;
  const [questions, answers] = await Promise.all([loadQuestions(row.testId), loadAnswers(row.id)]);

  const attempt: Attempt = {
    id: row.id,
    testId: row.testId,
    title: row.title,
    durationMinutes: row.durationMinutes,
    marksPerQuestion: Number(row.marksPerQuestion),
    negativeMarking: Number(row.negativeMarking),
    status: finished ? "submitted" : "running",
    secondsLeft: finished ? 0 : Math.max(0, row.secondsLeft),
    questions: questions.map((q) => ({ id: q.id, text: q.text, type: q.type, options: { A: q.a, B: q.b, C: q.c, D: q.d } })),
    answers,
  };

  if (finished) {
    const score = Number(row.score);
    const [[ahead], [done]] = await Promise.all([
      pool.query<(RowDataPacket & { n: number })[]>("SELECT COUNT(*) AS n FROM test_attempts WHERE test_id = ? AND submitted_at IS NOT NULL AND score > ?", [row.testId, score]),
      pool.query<(RowDataPacket & { n: number })[]>("SELECT COUNT(*) AS n FROM test_attempts WHERE test_id = ? AND submitted_at IS NOT NULL", [row.testId]),
    ]);
    attempt.result = {
      score,
      totalMarks: Number(row.totalMarks),
      correct: row.correct,
      incorrect: row.incorrect,
      unattempted: row.unattempted,
      total: questions.length,
      position: Number(ahead[0].n) + 1,
      finishedBy: Number(done[0].n),
    };
    attempt.review = questions.map((q) => {
      const selected = answers[q.id]?.selected ?? [];
      const correct = letters(q.correct);
      return { questionId: q.id, selected, correct, isCorrect: selected.length > 0 && sameOptions(selected, correct), explanation: q.explanation, reference: q.reference };
    });
  }
  return attempt;
}

export type StartOutcome = { ok: true; attempt: Attempt } | { ok: false; status: number; message: string };

// Starts the test for this student, or gives back the attempt that is already there (so a reload does not restart it)
export async function startAttempt(testId: number, studentId: number): Promise<StartOutcome> {
  const existing = await findAttemptRow("a.test_id = ? AND a.student_id = ?", [testId, studentId]);
  if (existing) return { ok: true, attempt: await buildAttempt(existing) };

  const [tests] = await pool.query<(RowDataPacket & { status: string; started: number })[]>(
    "SELECT status, (start_at <= NOW()) AS started FROM tests WHERE id = ? LIMIT 1",
    [testId],
  );
  const test = tests[0];
  if (!test || test.status === "draft") return { ok: false, status: 404, message: "Test not found" };
  if (test.started !== 1) return { ok: false, status: 409, message: "This test has not started yet." };
  if ((await loadQuestions(testId)).length === 0) return { ok: false, status: 409, message: "This test has no questions yet." };

  try {
    await pool.query("INSERT INTO test_attempts (test_id, student_id) VALUES (?, ?)", [testId, studentId]);
  } catch (error) {
    // 1062: two taps at once made the attempt already, which is fine
    if (!(typeof error === "object" && error !== null && "errno" in error && error.errno === 1062)) throw error;
  }
  const created = await findAttemptRow("a.test_id = ? AND a.student_id = ?", [testId, studentId]);
  if (!created) return { ok: false, status: 500, message: "Something went wrong" };
  return { ok: true, attempt: await buildAttempt(created) };
}

export async function getAttempt(attemptId: number, studentId: number): Promise<Attempt | null> {
  const row = await findAttemptRow("a.id = ? AND a.student_id = ?", [attemptId, studentId]);
  return row ? buildAttempt(row) : null;
}

export type SaveOutcome = { ok: true } | { ok: false; status: number; message: string };

// Saves what the student chose (an empty list clears it) and the review mark of one question
export async function saveAttemptAnswer(attemptId: number, studentId: number, questionId: number, selected: OptionKey[], marked: boolean): Promise<SaveOutcome> {
  const row = await findAttemptRow("a.id = ? AND a.student_id = ?", [attemptId, studentId]);
  if (!row) return { ok: false, status: 404, message: "Attempt not found" };
  if (row.submitted === 1) return { ok: false, status: 409, message: "This test is already submitted." };
  if (row.secondsLeft <= 0) {
    await grade(row);
    return { ok: false, status: 409, message: "Time is over. Your test was submitted." };
  }
  const questions = await loadQuestions(row.testId);
  const question = questions.find((q) => q.id === questionId);
  if (!question) return { ok: false, status: 404, message: "This question is not in the test" };
  if (question.type === "single" && selected.length > 1) return { ok: false, status: 400, message: "Choose only one option for this question." };

  await pool.query(
    `INSERT INTO test_attempt_answers (attempt_id, question_id, selected, marked) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE selected = VALUES(selected), marked = VALUES(marked)`,
    [attemptId, questionId, [...selected].sort().join(","), marked ? 1 : 0],
  );
  return { ok: true };
}

export async function submitAttempt(attemptId: number, studentId: number): Promise<Attempt | null> {
  const row = await findAttemptRow("a.id = ? AND a.student_id = ?", [attemptId, studentId]);
  if (!row) return null;
  if (row.submitted === 0) await grade(row);
  const done = await findAttemptRow("a.id = ?", [attemptId]);
  return done ? buildAttempt(done) : null;
}

