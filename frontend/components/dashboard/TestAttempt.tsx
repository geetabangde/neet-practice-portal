"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearToken, getToken } from "@/lib/studentAuth";
import { saveTestAnswer, submitTestAttempt, type Letter, type SavedTestAnswer, type TestAttemptData } from "@/lib/studentContent";
import { ArrowRightIcon, ClockIcon } from "./icons";
import Countdown from "./Countdown";
import QuestionPalette, { type PaletteStatus } from "./QuestionPalette";
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
  const total = attempt.questions.length;

  const [index, setIndex] = useState(0);
  // Answers the server has saved, by question id (what counts for marks)
  const [saved, setSaved] = useState<Record<number, SavedTestAnswer>>(() =>
    Object.fromEntries(Object.entries(attempt.answers).map(([id, answer]) => [Number(id), answer])),
  );
  // Options picked on screen but not saved yet
  const [draft, setDraft] = useState<Record<number, Letter[]>>({});
  // Questions the student has opened. One that has a saved row was opened in an earlier visit.
  const [visited, setVisited] = useState<Record<number, boolean>>(() => ({
    [attempt.questions[0]?.id ?? 0]: true,
    ...Object.fromEntries(Object.keys(attempt.answers).map((id) => [Number(id), true])),
  }));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // After the test is over this holds what the server marked
  const [done, setDone] = useState<TestAttemptData | null>(attempt.status === "submitted" ? attempt : null);
  const [resultOpen, setResultOpen] = useState(attempt.status === "submitted");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const confirmRef = useModalDialog(confirmOpen);

  const question = attempt.questions[index];
  const savedHere = saved[question.id];
  const picked = draft[question.id] ?? savedHere?.selected ?? [];
  const progress = ((index + 1) / total) * 100;
  const isLast = index === total - 1;
  const review = done?.review?.find((item) => item.questionId === question.id);

  const statuses: PaletteStatus[] = attempt.questions.map((q) => {
    if (reviewing) {
      const item = done?.review?.find((r) => r.questionId === q.id);
      if (!item || item.selected.length === 0) return "notVisited";
      return item.isCorrect ? "answered" : "notAnswered";
    }
    const answer = saved[q.id];
    const hasAnswer = (answer?.selected.length ?? 0) > 0;
    if (answer?.marked) return hasAnswer ? "answeredMarked" : "marked";
    if (hasAnswer) return "answered";
    return visited[q.id] ? "notAnswered" : "notVisited";
  });

  const answeredCount = attempt.questions.filter((q) => (saved[q.id]?.selected.length ?? 0) > 0).length;
  const markedCount = attempt.questions.filter((q) => saved[q.id]?.marked).length;

  // A login the server refuses sends the student back to /login. Returns true when the call worked.
  async function sendAnswer(questionId: number, answer: SavedTestAnswer): Promise<boolean> {
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

  function choose(letter: Letter) {
    if (done) return;
    if (question.type === "single") {
      setDraft((prev) => ({ ...prev, [question.id]: [letter] }));
      return;
    }
    setDraft((prev) => {
      const now = prev[question.id] ?? savedHere?.selected ?? [];
      return { ...prev, [question.id]: now.includes(letter) ? now.filter((l) => l !== letter) : [...now, letter].sort() };
    });
  }

  function dropDraft(questionId: number) {
    setDraft((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => Number(id) !== questionId)));
  }

  function goTo(next: number) {
    if (!reviewing) {
      dropDraft(question.id);
      setVisited((prev) => ({ ...prev, [attempt.questions[next].id]: true }));
    }
    setError(null);
    setIndex(next);
  }

  // Saves the picked options (if any) and the review mark, then moves on
  async function commitAndNext(markForReview: boolean) {
    const selected = draft[question.id] ?? savedHere?.selected ?? [];
    const marked = markForReview ? true : (savedHere?.marked ?? false);
    const changed = draft[question.id] !== undefined || marked !== (savedHere?.marked ?? false);
    if (changed && !(await sendAnswer(question.id, { selected, marked }))) return;
    dropDraft(question.id);
    if (!isLast) goTo(index + 1);
  }

  async function clearResponse() {
    dropDraft(question.id);
    if (savedHere && (savedHere.selected.length > 0 || savedHere.marked)) {
      await sendAnswer(question.id, { selected: [], marked: false });
    }
  }

  const resultData = done?.result;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-bold">Test Series</h1>
          <p className="mt-1 text-xs font-semibold uppercase">{attempt.title}</p>
        </div>

        <div className="flex w-full items-center gap-4 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-medium sm:w-auto sm:min-w-72">
          <span className="whitespace-nowrap">
            Question {index + 1} of {total}
          </span>
          <div
            role="progressbar"
            aria-label="Test progress"
            aria-valuenow={index + 1}
            aria-valuemin={1}
            aria-valuemax={total}
            className="h-1.5 flex-1 rounded-full bg-slate-200"
          >
            <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {done ? null : (
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium">
            <ClockIcon className="h-4 w-4" />
            <Countdown secondsLeft={attempt.secondsLeft} onEnd={() => void finish()} />
          </div>
        )}
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section aria-labelledby="attempt-question" className="rounded-xl bg-white p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-accent text-[11px] font-medium text-white">
              {index + 1}
            </span>
            <h2 id="attempt-question" className="text-base font-semibold leading-snug">
              {question.text}
            </h2>
          </div>

          {question.type === "multiple" ? (
            <p className="mt-3 text-xs font-medium text-accent-dark">More than one option is correct. Select all that apply.</p>
          ) : null}

          <div role={question.type === "single" ? "radiogroup" : "group"} aria-labelledby="attempt-question" className="mt-5 space-y-3">
            {LETTERS.map((letter) => {
              const selected = (reviewing ? review?.selected : picked)?.includes(letter) ?? false;
              const isRight = reviewing && (review?.correct.includes(letter) ?? false);
              const isWrong = reviewing && selected && !isRight;
              return (
                <button
                  suppressHydrationWarning
                  key={letter}
                  type="button"
                  role={question.type === "single" ? "radio" : "checkbox"}
                  aria-checked={selected}
                  disabled={reviewing || done !== null}
                  onClick={() => choose(letter)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    isRight
                      ? "border-green-600 bg-green-100"
                      : isWrong
                        ? "border-red-600 bg-red-100"
                        : selected
                          ? "border-accent bg-white"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                      isRight ? "bg-green-600 text-white" : isWrong ? "bg-red-600 text-white" : selected ? "bg-accent text-white" : "bg-accent-soft text-accent-dark"
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="flex-1">{question.options[letter]}</span>
                  {isRight ? <span className="text-sm font-bold text-green-700" aria-label="Correct option">✓</span> : null}
                  {isWrong ? <span className="text-sm font-bold text-red-700" aria-label="Your wrong choice">✗</span> : null}
                </button>
              );
            })}
          </div>

          <div role="status" aria-live="polite">
            {error ? <p className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error}</p> : null}
          </div>

          {reviewing && review ? (
            <div className={`mt-5 rounded-xl border p-4 ${review.isCorrect ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
              <p className={`text-sm font-semibold ${review.isCorrect ? "text-green-700" : "text-red-700"}`}>
                {review.selected.length === 0 ? "Not answered" : review.isCorrect ? "Correct!" : "Incorrect"}
                {!review.isCorrect ? (
                  <span className="font-medium text-brand-950">
                    {" "}
                    The right {review.correct.length > 1 ? "options are" : "option is"} {review.correct.join(" and ")}.
                  </span>
                ) : null}
              </p>
              {review.explanation ? (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase">Explanation</p>
                  <p className="mt-1 whitespace-pre-line text-sm">{review.explanation}</p>
                </div>
              ) : null}
              {review.reference ? <p className="mt-3 text-xs text-black/70">Reference: {review.reference}</p> : null}
            </div>
          ) : null}
        </section>

        <div>
          <QuestionPalette statuses={statuses} availableCount={total} current={index} onSelect={goTo} hideLegend={reviewing} />
          {reviewing ? (
            <p className="mt-3 rounded-xl bg-white p-3 text-[11px]">
              <span className="font-semibold text-green-700">Green</span> = right, <span className="font-semibold text-red-600">red</span> = wrong,{" "}
              <span className="font-semibold text-slate-500">grey</span> = not answered.
            </p>
          ) : null}
        </div>
      </div>

      {reviewing ? (
        <div className="sticky bottom-0 z-10 mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-3 py-3 backdrop-blur">
          <button suppressHydrationWarning type="button" disabled={index === 0} onClick={() => goTo(index - 1)} className={`${outlineButton} px-8`}>
            Previous
          </button>
          <Link href="/dashboard/test-series" className={`${outlineButton} px-8 text-center`}>
            Back to Test Series
          </Link>
          <button suppressHydrationWarning type="button" disabled={isLast} onClick={() => goTo(index + 1)} className={`${outlineButton} px-8`}>
            Next
          </button>
        </div>
      ) : done ? (
        <div className="mt-auto flex flex-wrap items-center justify-center gap-3 pt-6">
          <button suppressHydrationWarning type="button" onClick={() => setResultOpen(true)} className={`${outlineButton} px-8`}>
            Show result
          </button>
        </div>
      ) : (
        <div className="sticky bottom-0 z-10 mt-auto grid grid-cols-2 gap-3 border-t border-slate-200 bg-white/95 px-3 py-3 backdrop-blur sm:grid-cols-4">
          <button suppressHydrationWarning type="button" disabled={sending} onClick={() => void clearResponse()} className={outlineButton}>
            Clear Response
          </button>
          <button suppressHydrationWarning type="button" disabled={sending} onClick={() => void commitAndNext(true)} className={outlineButton}>
            Mark for Review &amp; Next
          </button>
          <button
            suppressHydrationWarning
            type="button"
            disabled={sending}
            onClick={() => void commitAndNext(false)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-xs font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
          >
            Save &amp; Next
            <ArrowRightIcon className="h-4 w-4" />
          </button>
          <button
            suppressHydrationWarning
            type="button"
            disabled={sending}
            onClick={() => setConfirmOpen(true)}
            className="rounded-lg bg-[#5f6368] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#4b4f53] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-950 disabled:opacity-60"
          >
            Submit
          </button>
        </div>
      )}

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
            {markedCount > 0 ? `, and ${markedCount} ${markedCount === 1 ? "is" : "are"} marked for review` : ""}. You cannot change your answers after you submit.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <button suppressHydrationWarning type="button" onClick={() => setConfirmOpen(false)} className={outlineButton}>
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
        marks={resultData ? { score: resultData.score, total: resultData.totalMarks } : undefined}
        canGrade
        correct={resultData?.correct ?? 0}
        incorrect={resultData?.incorrect ?? 0}
        total={resultData?.total ?? total}
        position={resultData?.position}
      />
    </div>
  );
}
