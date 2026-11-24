"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import { useStudent } from "@/components/auth/StudentGate";
import { clearToken, getToken } from "@/lib/studentAuth";
import {
  fetchTestAttempt,
  saveTestAnswer,
  submitTestAttempt,
  type AttemptSection,
  type Letter,
  type SavedTestAnswer,
  type TestAttemptData,
} from "@/lib/studentContent";
import Calculator from "./Calculator";
import InstructionBlocks from "./InstructionBlocks";
import { DocIcon } from "./icons";
import {
  generalInstructions,
  otherInstructions,
} from "@/data/testInstructions";
import Countdown from "./Countdown";
import QuestionImage from "./QuestionImage";
import RichText from "./RichText";
import ExamPalette from "./ExamPalette";
import type { PaletteStatus } from "./QuestionPalette";
import TestResult from "./TestResult";
import { useModalDialog } from "./useModalDialog";

const LETTERS: Letter[] = ["A", "B", "C", "D"];

const outlineButton =
  "rounded-lg border border-accent bg-white px-3 py-2.5 text-xs font-semibold hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

// The exam screen. The server keeps the clock and marks the test; this screen sends it every saved answer.
// Follows the exam rules from the instructions page: an answer only counts after "Save & Next" (or
// "Mark for Review & Next"), and picking a question from the palette does not save the current answer.
export default function TestAttempt({ attempt }: { attempt: TestAttemptData }) {
  const router = useRouter();
  const { student } = useStudent();
  const total = attempt.questions.length;

  // A test with parts starts (or comes back) in the part that is running now
  const [index, setIndex] = useState(() => {
    const running = attempt.sections.find((section) => section.status === "current");
    const first = running ? attempt.questions.findIndex((q) => q.sectionId === running.id) : 0;
    return first >= 0 ? first : 0;
  });
  // Answers the server has saved, by question id (what counts for marks)
  const [saved, setSaved] = useState<Record<number, SavedTestAnswer>>(() =>
    Object.fromEntries(
      Object.entries(attempt.answers).map(([id, answer]) => [
        Number(id),
        answer,
      ]),
    ),
  );
  // Options picked on screen but not saved yet
  const [draft, setDraft] = useState<Record<number, Letter[]>>({});
  // Questions the student has opened. One that has a saved row was opened in an earlier visit.
  const [visited, setVisited] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(
      Object.keys(attempt.answers).map((id) => [Number(id), true]),
    ),
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // After the test is over this holds what the server marked
  const [done, setDone] = useState<TestAttemptData | null>(
    attempt.status === "submitted" ? attempt : null,
  );
  const [resultOpen, setResultOpen] = useState(attempt.status === "submitted");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [paperOpen, setPaperOpen] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  // The last screen of the review: every answer and explanation, with a Finish button
  const [showAnswers, setShowAnswers] = useState(false);
  // The parts (Part A, Part B ...) as the server said last. syncKey restarts the timer after the server has been asked again.
  const [sections, setSections] = useState<AttemptSection[]>(attempt.sections);
  const [syncKey, setSyncKey] = useState(0);
  // The (i) of a part, and the message when a part has ended and the next one has started
  const [partInfo, setPartInfo] = useState<AttemptSection | null>(null);
  const [partOver, setPartOver] = useState<{ ended: string; next: string } | null>(null);

  const confirmRef = useModalDialog(confirmOpen);
  const paperRef = useModalDialog(paperOpen);
  const instructionsRef = useModalDialog(instructionsOpen);
  const partInfoRef = useModalDialog(partInfo !== null);
  const partOverRef = useModalDialog(partOver !== null);

  const question = attempt.questions[index];
  const savedHere = saved[question.id];
  const picked = draft[question.id] ?? savedHere?.selected ?? [];
  // A test with parts: only the questions of the part that is running can be opened. Everything else (a test with no parts,
  // the review after the test) shows all the questions.
  const hasParts = sections.length > 0;
  const running = hasParts && !done ? (sections.find((section) => section.status === "current") ?? null) : null;
  const visible = attempt.questions.map((_, i) => i).filter((i) => !running || attempt.questions[i].sectionId === running.id);
  const place = visible.indexOf(index);
  const isLast = place === visible.length - 1;
  const partNameOf = (sectionId: number | null) => sections.find((section) => section.id === sectionId)?.name ?? null;
  const review = done?.review?.find((item) => item.questionId === question.id);

  const statuses: PaletteStatus[] = attempt.questions.map((q) => {
    if (reviewing) {
      const item = done?.review?.find((r) => r.questionId === q.id);
      // Right = green, anything else (wrong or not answered) = red
      return item?.isCorrect ? "answered" : "notAnswered";
    }
    const answer = saved[q.id];
    const hasAnswer = (answer?.selected.length ?? 0) > 0;
    if (answer?.marked) return hasAnswer ? "answeredMarked" : "marked";
    if (hasAnswer) return "answered";
    return visited[q.id] ? "notAnswered" : "notVisited";
  });

  const visibleStatuses = visible.map((i) => statuses[i]);

  const answeredCount = attempt.questions.filter(
    (q) => (saved[q.id]?.selected.length ?? 0) > 0,
  ).length;
  const markedCount = attempt.questions.filter(
    (q) => saved[q.id]?.marked,
  ).length;

  // A login the server refuses sends the student back to /login. Returns true when the call worked.
  async function sendAnswer(
    questionId: number,
    answer: SavedTestAnswer,
  ): Promise<boolean> {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return false;
    }
    setSending(true);
    setError(null);
    const result = await saveTestAnswer(token, attempt.id, questionId, answer);
    setSending(false);
    if (result.ok) {
      setSaved((prev) => ({ ...prev, [questionId]: answer }));
      return true;
    }
    if (result.status === 401 || result.status === 403) {
      clearToken();
      router.replace("/login");
    } else if (result.status === 409) {
      // The time is over (or the test is already handed in): the server has closed it
      await finish();
    } else if (result.status === 423) {
      // The part is not open (its time ran out, or it has not started): ask the server which part is running
      await syncParts();
    } else {
      setError(result.message);
    }
    return false;
  }

  async function finish() {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setSending(true);
    const result = await submitTestAttempt(token, attempt.id);
    setSending(false);
    setConfirmOpen(false);
    if (!result.ok) {
      if (result.status === 401 || result.status === 403) {
        clearToken();
        router.replace("/login");
      } else {
        setError(result.message);
      }
      return;
    }
    setDone(result.data.attempt);
    setResultOpen(true);
  }

  // The time of a part ran out. The server decides what comes next: the next part, or (after the last part) the end of the test.
  async function syncParts() {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    const before = running;
    const result = await fetchTestAttempt(token, attempt.id);
    if (!result.ok) {
      if (result.status === 401 || result.status === 403) {
        clearToken();
        router.replace("/login");
      } else {
        setError(result.message);
      }
      return;
    }
    const fresh = result.data.attempt;
    // Every part is over: the server has marked the test
    if (fresh.status === "submitted") {
      setConfirmOpen(false);
      setDone(fresh);
      setResultOpen(true);
      return;
    }
    setSections(fresh.sections);
    setSyncKey((key) => key + 1);
    const now = fresh.sections.find((section) => section.status === "current");
    if (now && before && now.id !== before.id) {
      // The next part has started: its first question opens, and the answers not yet saved in the old part are dropped
      const first = attempt.questions.findIndex((q) => q.sectionId === now.id);
      setDraft({});
      setError(null);
      setIndex(first >= 0 ? first : 0);
      setPartOver({ ended: before.name, next: now.name });
    }
  }

  function choose(letter: Letter) {
    if (done) return;
    if (question.type === "single") {
      setDraft((prev) => ({ ...prev, [question.id]: [letter] }));
      return;
    }
    setDraft((prev) => {
      const now = prev[question.id] ?? savedHere?.selected ?? [];
      return {
        ...prev,
        [question.id]: now.includes(letter)
          ? now.filter((l) => l !== letter)
          : [...now, letter].sort(),
      };
    });
  }

  function dropDraft(questionId: number) {
    setDraft((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([id]) => Number(id) !== questionId),
      ),
    );
  }

  function goTo(next: number) {
    // A student cannot open a question of another part while the part he is in is running
    if (!visible.includes(next)) return;
    if (!reviewing) {
      dropDraft(question.id);
      setVisited((prev) => ({ ...prev, [question.id]: true }));
    }
    setError(null);
    setIndex(next);
  }

  // Saves the picked options (if any) and the review mark, then moves on
  async function commitAndNext(markForReview: boolean) {
    const selected = draft[question.id] ?? savedHere?.selected ?? [];
    const marked = markForReview ? true : (savedHere?.marked ?? false);
    const changed =
      draft[question.id] !== undefined ||
      marked !== (savedHere?.marked ?? false);
    if (changed && !(await sendAnswer(question.id, { selected, marked })))
      return;
    dropDraft(question.id);
    setVisited((prev) => ({ ...prev, [question.id]: true }));
    if (!isLast) goTo(visible[place + 1]);
  }

  async function clearResponse() {
    dropDraft(question.id);
    if (savedHere && (savedHere.selected.length > 0 || savedHere.marked)) {
      await sendAnswer(question.id, { selected: [], marked: false });
    }
  }

  const resultData = done?.result;

  if (showAnswers && done?.review) {
    return (
      <div className="flex min-h-screen flex-col bg-white px-4 py-5 text-brand-950 sm:px-6">
        <div className="mr-auto">
          <h1 className="text-2xl font-bold">Test Series</h1>
          <p className="mt-1 text-xs font-semibold uppercase">
            {attempt.title}
          </p>
        </div>

        <section
          aria-labelledby="answers-title"
          className="mt-4 rounded-xl bg-white p-3 sm:p-4"
        >
          <h2 id="answers-title" className="text-lg font-bold">
            Answers and Explanations
          </h2>
          <ol className="mt-4 space-y-4">
            {attempt.questions.map((q, i) => {
              const item = done.review?.find((r) => r.questionId === q.id);
              if (!item) return null;
              return (
                <li
                  key={q.id}
                  className={`rounded-xl border p-4 ${item.isCorrect ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}
                >
                  <p className="text-sm font-semibold">
                    {i + 1}. {q.text}
                  </p>
                  {q.imageToken ? <QuestionImage token={q.imageToken} label={`Image for question ${i + 1}`} small /> : null}
                  <p
                    className={`mt-2 text-sm font-semibold ${item.isCorrect ? "text-green-700" : "text-red-700"}`}
                  >
                    {item.selected.length === 0
                      ? "Not answered"
                      : item.isCorrect
                        ? "Correct!"
                        : "Incorrect"}
                    {item.selected.length > 0 ? (
                      <span className="font-medium text-brand-950">
                        {" "}
                        Your answer: {item.selected.join(" and ")}.
                      </span>
                    ) : null}
                    <span className="font-medium text-brand-950">
                      {" "}
                      The right{" "}
                      {item.correct.length > 1
                        ? "options are"
                        : "option is"}{" "}
                      {item.correct.join(" and ")}.
                    </span>
                  </p>
                  {item.explanation ? (
                    <div className="mt-3">
                      <p className="text-xs font-semibold uppercase">
                        Explanation
                      </p>
                      <RichText value={item.explanation} className="mt-1 text-sm" />
                    </div>
                  ) : null}
                  {item.reference ? (
                    <p className="mt-3 text-xs text-black/70">
                      Reference: {item.reference}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>

        <div className="sticky bottom-0 z-10 mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-3 py-3 backdrop-blur">
          <button
            suppressHydrationWarning
            type="button"
            onClick={() => setShowAnswers(false)}
            className={`${outlineButton} px-8`}
          >
            Back to Review
          </button>
          <Link
            href="/dashboard/test-series"
            className="inline-flex items-center justify-center rounded-lg bg-accent px-8 py-2.5 text-xs font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Finish
          </Link>
        </div>
      </div>
    );
  }

  const primary =
    "inline-flex items-center justify-center rounded-md bg-[#2f6fa8] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#25598a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6fa8] disabled:opacity-60";
  const plain =
    "rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex min-h-screen flex-col bg-white text-brand-950 lg:h-screen lg:overflow-hidden">
      <div className="flex items-center justify-end gap-6 bg-[#1b2d57] px-5 py-3 font-serif text-lg text-white">
        <button
          suppressHydrationWarning
          type="button"
          onClick={() => setPaperOpen(true)}
          className="inline-flex items-center gap-1.5 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <DocIcon className="h-5 w-5" />
          Question Paper
        </button>
        <button
          suppressHydrationWarning
          type="button"
          onClick={() => setInstructionsOpen(true)}
          className="inline-flex items-center gap-1.5 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
            <circle cx="10" cy="10" r="9" fill="currentColor" />
            <rect x="9" y="8.5" width="2" height="6" rx="0.5" fill="#1b2d57" />
            <circle cx="10" cy="5.8" r="1.2" fill="#1b2d57" />
          </svg>
          Instructions
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col lg:min-h-0">
          {done ? null : (
            <div className="flex justify-end border-b border-slate-300">
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setCalculatorOpen((open) => !open)}
                aria-label="Calculator"
                aria-expanded={calculatorOpen}
                className="bg-[#e9ecef] px-5 py-2 hover:bg-[#dee2e6] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
              >
                <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
                  <rect
                    x="4"
                    y="2"
                    width="16"
                    height="20"
                    rx="3"
                    fill="#f5a623"
                  />
                  <rect x="7" y="5" width="10" height="4" rx="1" fill="#fff" />
                  <g fill="#fff">
                    <circle cx="8.5" cy="12.5" r="1.1" />
                    <circle cx="12" cy="12.5" r="1.1" />
                    <circle cx="15.5" cy="12.5" r="1.1" />
                    <circle cx="8.5" cy="16" r="1.1" />
                    <circle cx="12" cy="16" r="1.1" />
                    <circle cx="15.5" cy="16" r="1.1" />
                    <circle cx="8.5" cy="19.2" r="1.1" />
                    <circle cx="12" cy="19.2" r="1.1" />
                    <circle cx="15.5" cy="19.2" r="1.1" />
                  </g>
                </svg>
              </button>
            </div>
          )}
          {running ? (
            <div role="tablist" aria-label="Parts of the test" className="flex gap-2 overflow-x-auto border-b border-slate-300 px-4 pt-3 sm:px-6">
              {sections.map((section) => (
                <div
                  key={section.id}
                  role="tab"
                  aria-selected={section.status === "current"}
                  aria-disabled={section.status !== "current"}
                  title={section.status === "upcoming" ? "This part opens when the time of the part before it is over" : section.status === "finished" ? "This part is over" : "The part you are in"}
                  className={`flex shrink-0 items-center gap-2 rounded-t-xl px-5 py-2 text-lg ${
                    section.status === "current"
                      ? "bg-[#2f9bf0] text-white"
                      : section.status === "finished"
                        ? "bg-slate-100 text-slate-400"
                        : "bg-[#d9eefc] text-[#6aa6d1]"
                  }`}
                >
                  {section.status === "upcoming" ? <span aria-hidden="true">🔒</span> : null}
                  {section.status === "finished" ? <span aria-hidden="true">✓</span> : null}
                  {section.name}
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={() => setPartInfo(section)}
                    aria-label={`About ${section.name}`}
                    className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                  >
                    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
                      <circle cx="10" cy="10" r="9" fill="currentColor" />
                      <rect x="9" y="8.5" width="2" height="6" rx="0.5" fill="#fff" />
                      <circle cx="10" cy="5.8" r="1.2" fill="#fff" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3 border-b border-slate-300 px-4 py-4 sm:px-6">
            <p className="min-w-0 truncate text-lg font-bold">
              {running ? `Current Section: ${running.name}` : `Test: ${attempt.title}`}
            </p>
            {done ? (
              <p className="whitespace-nowrap text-lg font-bold">Review</p>
            ) : running ? (
              <p className="whitespace-nowrap text-lg font-bold">
                Time Left:{" "}
                <Countdown
                  key={`${running.id}-${syncKey}`}
                  secondsLeft={running.secondsLeft}
                  onEnd={() => void syncParts()}
                />
              </p>
            ) : (
              <p className="whitespace-nowrap text-lg font-bold">
                Time Left:{" "}
                <Countdown
                  secondsLeft={attempt.secondsLeft}
                  onEnd={() => void finish()}
                />
              </p>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <p className="border-b border-slate-300 px-4 py-3 text-lg font-bold text-red-600 sm:px-6">
              Question type :{" "}
              {question.type === "single"
                ? "MCQ"
                : "MCQ (more than one answer)"}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 px-4 py-3 sm:px-6">
              <p className="text-lg font-bold">
                Question no : {index + 1}
                <span className="text-sm font-normal"> of {total}</span>
                {reviewing && partNameOf(question.sectionId) ? <span className="ml-3 text-sm font-medium text-slate-500">{partNameOf(question.sectionId)}</span> : null}
              </p>
              <p className="text-xs font-semibold text-slate-600 sm:text-sm">
                <span className="text-emerald-700">+{attempt.marksPerQuestion}</span>
                <span className="mx-2 text-slate-400">·</span>
                <span className="text-red-700">
                  −{attempt.negativeMarking}
                </span>
              </p>
            </div>

            <section
              aria-labelledby="attempt-question"
              className="px-4 py-5 sm:px-6"
            >
              <h2 id="attempt-question" className="text-lg leading-snug">
                {question.text}
              </h2>

              {question.imageToken ? <QuestionImage key={question.id} token={question.imageToken} label={`Image for question ${index + 1}`} /> : null}

              <div
                role={question.type === "single" ? "radiogroup" : "group"}
                aria-labelledby="attempt-question"
                className="mt-6 space-y-3"
              >
                {LETTERS.map((letter) => {
                  const selected =
                    (reviewing ? review?.selected : picked)?.includes(letter) ??
                    false;
                  const isRight =
                    reviewing && (review?.correct.includes(letter) ?? false);
                  // In the review every option that is not right is red
                  const isWrong = reviewing && !isRight;
                  const pickedWrong = isWrong && selected;
                  return (
                    <button
                      suppressHydrationWarning
                      key={letter}
                      type="button"
                      role={question.type === "single" ? "radio" : "checkbox"}
                      aria-checked={selected}
                      disabled={reviewing || done !== null}
                      onClick={() => choose(letter)}
                      className={`flex w-full items-center gap-3 rounded-md border px-3 py-3 text-left text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                        isRight
                          ? "border-green-600 bg-green-100"
                          : isWrong
                            ? "border-red-600 bg-red-100"
                            : selected
                              ? "border-[#2f6fa8] bg-[#eaf3fb]"
                              : "border-transparent hover:bg-slate-50"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`flex h-4 w-4 shrink-0 items-center justify-center border-2 ${
                          question.type === "single"
                            ? "rounded-full"
                            : "rounded-sm"
                        } ${selected ? "border-[#2f6fa8]" : "border-slate-500"}`}
                      >
                        {selected ? (
                          <span
                            className={`h-2 w-2 ${question.type === "single" ? "rounded-full" : "rounded-[1px]"} bg-[#2f6fa8]`}
                          />
                        ) : null}
                      </span>
                      <span className="flex-1">
                        {letter}. <RichText value={question.options[letter]} inline />
                      </span>
                      {isRight ? (
                        <span
                          className="text-base font-bold text-green-700"
                          aria-label="Correct option"
                        >
                          ✓
                        </span>
                      ) : null}
                      {pickedWrong ? (
                        <span
                          className="text-base font-bold text-red-700"
                          aria-label="Your wrong choice"
                        >
                          ✗
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div role="status" aria-live="polite">
                {error ? (
                  <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                    {error}
                  </p>
                ) : null}
              </div>
            </section>
          </div>

          {reviewing ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-300 bg-white px-4 py-3 sm:px-6">
              <button
                suppressHydrationWarning
                type="button"
                disabled={index === 0}
                onClick={() => goTo(index - 1)}
                className={plain}
              >
                Previous
              </button>
              <Link
                href="/dashboard/test-series"
                className={`${plain} text-center`}
              >
                Back to Test Series
              </Link>
              {isLast ? (
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => setShowAnswers(true)}
                  className={primary}
                >
                  Finish
                </button>
              ) : (
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => goTo(index + 1)}
                  className={primary}
                >
                  Next
                </button>
              )}
            </div>
          ) : done ? (
            <div className="flex items-center justify-center border-t border-slate-300 bg-white px-4 py-3">
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setResultOpen(true)}
                className={plain}
              >
                Show result
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-300 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-wrap gap-3">
                <button
                  suppressHydrationWarning
                  type="button"
                  disabled={sending}
                  onClick={() => void commitAndNext(true)}
                  className={plain}
                >
                  Mark for Review &amp; Next
                </button>
                <button
                  suppressHydrationWarning
                  type="button"
                  disabled={sending}
                  onClick={() => void clearResponse()}
                  className={plain}
                >
                  Clear Response
                </button>
              </div>
              <button
                suppressHydrationWarning
                type="button"
                disabled={sending}
                onClick={() => void commitAndNext(false)}
                className={primary}
              >
                Save and Next
              </button>
            </div>
          )}
        </div>

        <aside
          aria-label="Question palette"
          className="flex flex-col border-t border-slate-300 lg:min-h-0 lg:w-[22rem] lg:shrink-0 lg:border-l lg:border-t-0"
        >
          <div className="grid grid-cols-2 border-b border-slate-400">
            <div className="flex items-center justify-center border-r border-slate-400 p-4">
              <span className="rounded-sm border border-slate-200 p-2 shadow-sm">
                <span
                  aria-hidden="true"
                  className="flex h-24 w-24 items-center justify-center bg-[#2f6b17] text-5xl font-light text-white"
                >
                  {student.name.trim().charAt(0).toUpperCase() || "S"}
                </span>
              </span>
            </div>
            <p className="flex items-center justify-center break-words px-3 text-center text-xl font-bold text-[#7b8aa0]">
              {student.name}
            </p>
          </div>

          <ExamPalette
            statuses={visibleStatuses}
            numbers={visible.map((i) => i + 1)}
            title={running ? running.name : "Test"}
            current={place}
            onSelect={(local) => goTo(visible[local])}
          />

          {done ? null : (
            <div className="flex flex-col items-center gap-1.5 border-t border-slate-300 px-4 py-3">
              {/* The test cannot be handed in early: it is submitted by itself when the time is over (Countdown) */}
              <button
                suppressHydrationWarning
                type="button"
                disabled
                aria-describedby="submit-note"
                className="cursor-not-allowed rounded-md bg-[#4a9be0] px-10 py-2.5 text-sm font-bold text-white opacity-50"
              >
                Submit
              </button>
              <p
                id="submit-note"
                className="text-center text-xs text-slate-600"
              >
                {hasParts
                  ? "Submit works only when the last part is over. The test is then submitted automatically."
                  : "Submit works only when the time is over. The test is then submitted automatically."}
              </p>
            </div>
          )}
        </aside>
      </div>

      <dialog
        ref={paperRef}
        onClose={() => setPaperOpen(false)}
        aria-labelledby="paper-title"
        className="m-auto max-h-[92vh] w-[calc(100%-1rem)] max-w-5xl overflow-y-auto rounded-md bg-white p-0 text-[#333] shadow-2xl backdrop:bg-black/50"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between bg-[#3c5a9a] px-3 py-2 text-white">
          <h2 id="paper-title" className="text-xl">
            Question Paper
          </h2>
          <button suppressHydrationWarning type="button" onClick={() => setPaperOpen(false)} className="px-2 text-base font-bold leading-none hover:bg-white/10" aria-label="Close question paper">
            ×
          </button>
        </div>
        <div className="p-3 sm:p-4">
          <p className="text-xl">{attempt.title}</p>
          <table className="mt-3 w-full border-collapse border border-slate-700 text-left text-[15px] leading-relaxed">
            <caption className="sr-only">Questions of {attempt.title}</caption>
            <tbody>
              {attempt.questions.map((q, i) => (
                <Fragment key={q.id}>
                  {hasParts && (i === 0 || attempt.questions[i - 1].sectionId !== q.sectionId) ? (
                    <tr className="border-b border-slate-700 bg-slate-100">
                      <th colSpan={2} scope="colgroup" className="px-3 py-2 text-left font-bold">
                        {partNameOf(q.sectionId) ?? "Questions"}
                      </th>
                    </tr>
                  ) : null}
                <tr className="border-b border-slate-700">
                  <th scope="row" className="w-14 whitespace-nowrap border-r border-slate-700 px-3 py-3 align-top font-normal">
                    {i + 1}.)
                  </th>
                  <td className="px-3 py-3 align-top">
                    {q.text}
                    {q.imageToken ? <QuestionImage token={q.imageToken} label={`Image for question ${i + 1}`} small /> : null}
                  </td>
                </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </dialog>

      <dialog
        ref={instructionsRef}
        onClose={() => setInstructionsOpen(false)}
        aria-labelledby="instructions-title"
        className="m-auto max-h-[85vh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-xl bg-white p-0 text-brand-950 shadow-2xl backdrop:bg-black/50"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-300 bg-[#1b2d57] px-5 py-3 text-white">
          <h2 id="instructions-title" className="font-serif text-lg">
            Instructions
          </h2>
          <button
            suppressHydrationWarning
            type="button"
            onClick={() => setInstructionsOpen(false)}
            className="rounded px-2 text-2xl leading-none hover:bg-white/10"
            aria-label="Close instructions"
          >
            ×
          </button>
        </div>
        <div className="p-5">
          <InstructionBlocks groups={generalInstructions} />
          <div className="mt-4">
            <InstructionBlocks groups={otherInstructions} />
          </div>
        </div>
      </dialog>

      <dialog
        ref={partInfoRef}
        onClose={() => setPartInfo(null)}
        aria-labelledby="part-info-title"
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-0 text-brand-950 shadow-2xl backdrop:bg-black/50"
      >
        {partInfo ? (
          <>
            <div className="flex items-center justify-between bg-[#2f9bf0] px-5 py-3 text-white">
              <h2 id="part-info-title" className="text-lg font-bold">
                {partInfo.name}
              </h2>
              <button suppressHydrationWarning type="button" onClick={() => setPartInfo(null)} className="rounded px-2 text-2xl leading-none hover:bg-white/10" aria-label="Close">
                ×
              </button>
            </div>
            <div className="space-y-3 p-5 text-sm">
              <p>
                <strong>{partInfo.questionCount}</strong> {partInfo.questionCount === 1 ? "question" : "questions"} · <strong>{partInfo.durationMinutes}</strong> minutes
              </p>
              <p className="text-slate-600">
                {partInfo.status === "current"
                  ? "You are in this part now."
                  : partInfo.status === "finished"
                    ? "This part is over. You cannot go back to it."
                    : "This part opens when the time of the part before it is over."}
              </p>
              {partInfo.instructions ? <p className="whitespace-pre-line">{partInfo.instructions}</p> : null}
              <p className="text-xs text-slate-500">You cannot go to the next part until the time of the part you are in runs out.</p>
            </div>
          </>
        ) : null}
      </dialog>

      <dialog
        ref={partOverRef}
        aria-labelledby="part-over-title"
        // No close on Escape: the student reads this message first
        onCancel={(event) => event.preventDefault()}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-tint p-0 text-brand-950 shadow-2xl backdrop:bg-black/50"
      >
        {partOver ? (
          <div className="p-6 text-center sm:p-8">
            <h2 id="part-over-title" className="text-xl font-semibold">
              {partOver.ended} is over
            </h2>
            <p className="mt-3 text-sm">
              The time of {partOver.ended} has run out. <strong>{partOver.next}</strong> has started now. You cannot go back to {partOver.ended}.
            </p>
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => setPartOver(null)}
              className="mt-6 rounded-lg bg-accent px-8 py-2.5 text-xs font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Start {partOver.next}
            </button>
          </div>
        ) : null}
      </dialog>

      {calculatorOpen && !done ? (
        <Calculator onClose={() => setCalculatorOpen(false)} />
      ) : null}

      <dialog
        ref={confirmRef}
        onClose={() => setConfirmOpen(false)}
        aria-labelledby="submit-title"
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-tint p-0 text-brand-950 shadow-2xl backdrop:bg-black/50"
      >
        <div className="p-6 text-center sm:p-8">
          <h2 id="submit-title" className="text-xl font-semibold">
            Submit the test?
          </h2>
          <p className="mt-3 text-xs">
            You answered {answeredCount} of {total} questions
            {markedCount > 0
              ? `, and ${markedCount} ${markedCount === 1 ? "is" : "are"} marked for review`
              : ""}
            . You cannot change your answers after you submit.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => setConfirmOpen(false)}
              className={outlineButton}
            >
              Go back
            </button>
            <button
              suppressHydrationWarning
              type="button"
              disabled={sending}
              onClick={() => void finish()}
              className="rounded-lg bg-accent px-4 py-2.5 text-xs font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
            >
              {sending ? "Submitting..." : "Yes, submit"}
            </button>
          </div>
        </div>
      </dialog>

      <TestResult
        open={resultOpen && resultData !== undefined}
        onClose={() => {
          // Closing the result goes to the review, so the right and wrong answers are always visible
          setResultOpen(false);
          setReviewing(true);
        }}
        onReview={() => {
          setResultOpen(false);
          setReviewing(true);
          setIndex(0);
        }}
        finishHref="/dashboard/test-series"
        marks={
          resultData
            ? { score: resultData.score, total: resultData.totalMarks }
            : undefined
        }
        canGrade
        correct={resultData?.correct ?? 0}
        incorrect={resultData?.incorrect ?? 0}
        total={resultData?.total ?? total}
        position={resultData?.position}
      />
    </div>
  );
}
