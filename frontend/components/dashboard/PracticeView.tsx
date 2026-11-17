"use client";

import { useState } from "react";
import type { AnswerFeedback, Letter, PracticeQuestion } from "@/lib/studentContent";
import { ArrowLeftIcon, ArrowRightIcon, BookmarkIcon, ClockIcon } from "./icons";
import TestResult from "./TestResult";
import Timer from "./Timer";
import type { ToggleBookmark } from "./useToggleBookmark";

const LETTERS: Letter[] = ["A", "B", "C", "D"];

// What a screen needs to know after the student answered: what was chosen, and what the server said
type Answered = { selected: Letter[]; feedback: AnswerFeedback };

export type SubmitAnswer = (questionId: number, selected: Letter[]) => Promise<{ ok: true; feedback: AnswerFeedback } | { ok: false; message: string }>;

type PracticeViewProps = {
  title: string;
  questions: PracticeQuestion[];
  // Sends the answer to the server, which marks it and saves it
  submit: SubmitAnswer;
  // Saves or removes the bookmark of a question. Leave it out to show no bookmark button.
  toggleBookmark?: ToggleBookmark;
};

const roundButtonClass =
  "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

// Practice: one question at a time. A single-answer question is marked the moment an option is picked.
// A multiple-answer question lets the student pick several options and then press "Check answer".
// The right answer and the explanation come from the server only after the answer was sent.
export default function PracticeView({ title, questions, submit, toggleBookmark }: PracticeViewProps) {
  const [index, setIndex] = useState(0);
  // Options picked but not sent yet (multiple-answer questions), by question id
  const [draft, setDraft] = useState<Record<number, Letter[]>>({});
  const [answered, setAnswered] = useState<Record<number, Answered>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  // Which questions are bookmarked: what the server said at the start, then what the student changes
  const [bookmarked, setBookmarked] = useState<Record<number, boolean>>(() => Object.fromEntries(questions.map((q) => [q.id, q.bookmarked])));
  const [marking, setMarking] = useState(false);

  const question = questions[index];
  const result = answered[question.id];
  const picked = result?.selected ?? draft[question.id] ?? [];
  const isLast = index === questions.length - 1;
  const progress = ((index + 1) / questions.length) * 100;

  const answeredList = Object.values(answered);
  const correctCount = answeredList.filter((a) => a.feedback.isCorrect).length;
  const incorrectCount = answeredList.length - correctCount;

  async function send(selected: Letter[]) {
    setSending(true);
    setError(null);
    const outcome = await submit(question.id, selected);
    setSending(false);
    if (!outcome.ok) return setError(outcome.message);
    setAnswered((prev) => ({ ...prev, [question.id]: { selected, feedback: outcome.feedback } }));
  }

  function choose(letter: Letter) {
    if (result || sending) return;
    if (question.type === "single") {
      // One answer only: choosing it is answering it
      void send([letter]);
      return;
    }
    setDraft((prev) => {
      const now = prev[question.id] ?? [];
      return { ...prev, [question.id]: now.includes(letter) ? now.filter((l) => l !== letter) : [...now, letter].sort() };
    });
  }

  // The button changes only after the server has saved the change
  async function flipBookmark() {
    if (!toggleBookmark || marking) return;
    const next = !bookmarked[question.id];
    setMarking(true);
    setError(null);
    const outcome = await toggleBookmark(question.id, next);
    setMarking(false);
    if (!outcome.ok) return setError(outcome.message);
    setBookmarked((prev) => ({ ...prev, [question.id]: next }));
  }

  function goTo(next: number) {
    setError(null);
    setIndex(next);
  }

  function retake() {
    setAnswered({});
    setDraft({});
    setError(null);
    setIndex(0);
    setResultOpen(false);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-bold">{title}</h1>
          <h2 className="mt-1 text-xs font-semibold uppercase">MCQs</h2>
        </div>

        <div className="flex w-full items-center gap-4 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-medium sm:w-auto sm:min-w-72 sm:flex-1 sm:max-w-md lg:max-w-xs xl:max-w-md">
          <span className="whitespace-nowrap">
            Question {index + 1} of {questions.length}
          </span>
          <div
            role="progressbar"
            aria-label="Practice progress"
            aria-valuenow={index + 1}
            aria-valuemin={1}
            aria-valuemax={questions.length}
            className="h-1.5 flex-1 rounded-full bg-slate-200"
          >
            <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium">
          <ClockIcon className="h-4 w-4" />
          <Timer key={index} />
        </div>

        {toggleBookmark ? (
          <button
            suppressHydrationWarning
            type="button"
            aria-label={bookmarked[question.id] ? "Remove bookmark" : "Bookmark this question"}
            aria-pressed={bookmarked[question.id] === true}
            disabled={marking}
            onClick={() => void flipBookmark()}
            className={`flex h-10 w-10 items-center justify-center rounded-full border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60 ${
              bookmarked[question.id] ? "border-accent bg-accent text-white" : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <BookmarkIcon className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <section aria-labelledby="practice-question" className="mt-4 rounded-xl bg-white p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-accent text-[11px] font-medium text-white">
            {index + 1}
          </span>
          <h3 id="practice-question" className="text-base font-semibold leading-snug">
            {question.text}
          </h3>
        </div>

        {question.type === "multiple" ? (
          <p className="mt-3 text-xs font-medium text-accent-dark">More than one option is correct. Select all that apply.</p>
        ) : null}

        <div
          role={question.type === "single" ? "radiogroup" : "group"}
          aria-labelledby="practice-question"
          className="mt-5 space-y-3"
        >
          {LETTERS.map((letter) => {
            const selected = picked.includes(letter);
            const isRight = result?.feedback.correct.includes(letter) ?? false;
            const isWrong = result !== undefined && selected && !isRight;
            return (
              <button
                suppressHydrationWarning
                key={letter}
                type="button"
                role={question.type === "single" ? "radio" : "checkbox"}
                aria-checked={selected}
                disabled={result !== undefined || sending}
                onClick={() => choose(letter)}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  isRight
                    ? "border-green-600 bg-green-100"
                    : isWrong
                      ? "border-red-600 bg-red-100"
                      : selected
                        ? "border-accent bg-accent-soft"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                } ${result !== undefined && !isRight && !isWrong ? "opacity-80" : ""}`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    isRight
                      ? "bg-green-600 text-white"
                      : isWrong
                        ? "bg-red-600 text-white"
                        : selected
                          ? "bg-accent text-white"
                          : "bg-accent-soft text-accent-dark"
                  }`}
                >
                  {letter}
                </span>
                <span className={`flex-1 ${isRight ? "font-semibold text-green-900" : isWrong ? "font-semibold text-red-900" : ""}`}>
                  {question.options[letter]}
                </span>
                {/* A tick on the right option, a cross on a wrong choice. The words are for screen readers. */}
                {isRight ? (
                  <span className="text-sm font-bold text-green-700">
                    <span aria-hidden="true">✓</span>
                    <span className="sr-only">Correct option</span>
                  </span>
                ) : null}
                {isWrong ? (
                  <span className="text-sm font-bold text-red-700">
                    <span aria-hidden="true">✗</span>
                    <span className="sr-only">Your wrong choice</span>
                  </span>
                ) : null}
                {/* How many students chose each option appears once the question is answered */}
                {result ? (
                  <span className={`text-sm font-medium ${isRight ? "text-green-800" : isWrong ? "text-red-800" : ""}`}>
                    {result.feedback.percents[letter].toFixed(2)}%
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {question.type === "multiple" && !result ? (
          <button
            suppressHydrationWarning
            type="button"
            disabled={picked.length === 0 || sending}
            onClick={() => void send(picked)}
            className={`${roundButtonClass} mt-4 bg-accent text-white hover:bg-accent-dark`}
          >
            {sending ? "Checking..." : "Check answer"}
          </button>
        ) : null}

        <div role="status" aria-live="polite">
          {error ? <p className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error}</p> : null}
        </div>

        {result ? (
          <div className={`mt-5 rounded-xl border p-4 ${result.feedback.isCorrect ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
            <p className={`text-sm font-semibold ${result.feedback.isCorrect ? "text-green-700" : "text-red-700"}`}>
              {result.feedback.isCorrect ? "Correct!" : "Incorrect"}
              {!result.feedback.isCorrect ? (
                <span className="font-medium text-brand-950">
                  {" "}
                  The right {result.feedback.correct.length > 1 ? "options are" : "option is"} {result.feedback.correct.join(" and ")}.
                </span>
              ) : null}
            </p>
            {result.feedback.explanation ? (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase">Explanation</p>
                <p className="mt-1 whitespace-pre-line text-sm">{result.feedback.explanation}</p>
              </div>
            ) : null}
            {result.feedback.reference ? <p className="mt-3 text-xs text-black/70">Reference: {result.feedback.reference}</p> : null}
          </div>
        ) : null}
      </section>

      <TestResult
        open={resultOpen}
        onClose={() => setResultOpen(false)}
        onReview={() => {
          goTo(0);
          setResultOpen(false);
        }}
        onRetake={retake}
        canGrade
        correct={correctCount}
        incorrect={incorrectCount}
        total={questions.length}
      />

      <div className="mt-auto flex items-center justify-between pt-6">
        <button
          suppressHydrationWarning
          type="button"
          disabled={index === 0}
          onClick={() => goTo(index - 1)}
          className={`${roundButtonClass} border border-accent bg-white hover:bg-accent-soft`}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Previous
        </button>
        <button
          suppressHydrationWarning
          type="button"
          disabled={sending}
          onClick={() => (isLast ? setResultOpen(true) : goTo(index + 1))}
          className={`${roundButtonClass} bg-accent px-8 text-white hover:bg-accent-dark`}
        >
          {isLast ? "Finish" : "Next"}
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
