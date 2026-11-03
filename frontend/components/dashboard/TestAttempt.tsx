"use client";

import Image from "next/image";
import { useState } from "react";
import type { SubjectQuestion, TestQuestionStatus } from "@/types/dashboard";
import { ArrowRightIcon, ClockIcon } from "./icons";
import QuestionPalette, { type PaletteStatus } from "./QuestionPalette";
import TestResult from "./TestResult";
import Timer from "./Timer";

const LETTERS = ["A", "B", "C", "D", "E"];

type TestAttemptProps = {
  // Questions in the whole test. Only some may be loaded so far.
  total: number;
  questions: SubjectQuestion[];
  // Palette progress to start with (a sample). Leave out for a fresh test.
  sampleStatuses?: TestQuestionStatus[];
};

// Turns palette statuses into the three records the screen keeps.
// Answered questions get option B, as in the design.
function seed(statuses: TestQuestionStatus[] | undefined) {
  const visited: Record<number, boolean> = { 0: true };
  const saved: Record<number, number> = {};
  const marked: Record<number, boolean> = {};
  statuses?.forEach((status, i) => {
    if (status !== "notVisited") visited[i] = true;
    if (status === "answered" || status === "answeredMarked") saved[i] = 1;
    if (status === "marked" || status === "answeredMarked") marked[i] = true;
  });
  return { visited, saved, marked };
}

// Copy of a record without one key
function withoutKey(record: Record<number, number>, key: number) {
  return Object.fromEntries(Object.entries(record).filter(([k]) => Number(k) !== key)) as Record<number, number>;
}

const outlineButton =
  "rounded-lg border border-accent bg-white px-3 py-2.5 text-xs font-semibold hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

// Follows the exam rules from the instructions page:
// an answer only counts after "Save & Next" (or "Mark for Review & Next"),
// and picking a question from the palette does not save the current answer.
export default function TestAttempt({ total, questions, sampleStatuses }: TestAttemptProps) {
  const [index, setIndex] = useState(0);
  const [visited, setVisited] = useState<Record<number, boolean>>(() => seed(sampleStatuses).visited);
  // Answers that count for evaluation (option index per question)
  const [saved, setSaved] = useState<Record<number, number>>(() => seed(sampleStatuses).saved);
  // Option picked but not saved yet
  const [draft, setDraft] = useState<Record<number, number>>({});
  const [marked, setMarked] = useState<Record<number, boolean>>(() => seed(sampleStatuses).marked);
  const [resultOpen, setResultOpen] = useState(false);

  const totalQuestions = Math.max(total, questions.length);
  const question = questions[index];
  const selected = draft[index] ?? saved[index];
  const progress = ((index + 1) / totalQuestions) * 100;
  const isLast = index === questions.length - 1;

  const statuses: PaletteStatus[] = Array.from({ length: totalQuestions }, (_, i) => {
    const hasAnswer = saved[i] !== undefined;
    if (marked[i]) return hasAnswer ? "answeredMarked" : "marked";
    if (hasAnswer) return "answered";
    return visited[i] ? "notAnswered" : "notVisited";
  });

  function dropDraft() {
    setDraft((prev) => withoutKey(prev, index));
  }

  function goTo(next: number) {
    dropDraft();
    setVisited((prev) => ({ ...prev, [next]: true }));
    setIndex(next);
  }

  // Saves the picked option (if any), then moves on
  function commitAndNext(markForReview: boolean) {
    if (draft[index] !== undefined) setSaved((prev) => ({ ...prev, [index]: draft[index] }));
    if (markForReview) setMarked((prev) => ({ ...prev, [index]: true }));
    dropDraft();
    if (!isLast) {
      setVisited((prev) => ({ ...prev, [index + 1]: true }));
      setIndex(index + 1);
    }
  }

  function clearResponse() {
    dropDraft();
    setSaved((prev) => withoutKey(prev, index));
  }

  function retake() {
    setIndex(0);
    setVisited({ 0: true });
    setSaved({});
    setDraft({});
    setMarked({});
    setResultOpen(false);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-bold">Test Series</h1>
          <p className="mt-1 text-xs font-semibold uppercase">Year 2025 - 26</p>
        </div>

        <div className="flex w-full items-center gap-4 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-medium sm:w-auto sm:min-w-72">
          <span className="whitespace-nowrap">
            Question {index + 1} of {totalQuestions}
          </span>
          <div
            role="progressbar"
            aria-label="Test progress"
            aria-valuenow={index + 1}
            aria-valuemin={1}
            aria-valuemax={totalQuestions}
            className="h-1.5 flex-1 rounded-full bg-slate-200"
          >
            <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium">
          <ClockIcon className="h-4 w-4" />
          <Timer label="Time since the test started" />
        </div>
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

          {question.image ? (
            <div className="mt-4 flex h-32 w-full max-w-56 items-center justify-center rounded-lg bg-accent-soft p-2">
              <Image
                src={`/modules/${question.image}.png`}
                alt=""
                width={320}
                height={200}
                className="h-full w-full object-contain"
              />
            </div>
          ) : null}

          <div role="radiogroup" aria-labelledby="attempt-question" className="mt-5 space-y-3">
            {question.options.map((option, i) => (
              <button
                suppressHydrationWarning
                key={option.text}
                type="button"
                role="radio"
                aria-checked={selected === i}
                onClick={() => setDraft((prev) => ({ ...prev, [index]: i }))}
                className={`flex w-full items-center gap-3 rounded-lg border bg-white px-3 py-2.5 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  selected === i ? "border-accent" : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-medium text-accent-dark">
                  {LETTERS[i]}
                </span>
                {option.text}
              </button>
            ))}
          </div>
        </section>

        <QuestionPalette statuses={statuses} availableCount={questions.length} current={index} onSelect={goTo} />
      </div>

      <div className="mt-auto grid grid-cols-2 gap-3 pt-6 sm:grid-cols-4">
        <button suppressHydrationWarning type="button" onClick={clearResponse} className={outlineButton}>
          Clear Response
        </button>
        <button suppressHydrationWarning type="button" onClick={() => commitAndNext(true)} className={outlineButton}>
          Mark for Review &amp; Next
        </button>
        <button
          suppressHydrationWarning
          type="button"
          onClick={() => commitAndNext(false)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-xs font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Save &amp; Next
          <ArrowRightIcon className="h-4 w-4" />
        </button>
        <button
          suppressHydrationWarning
          type="button"
          onClick={() => setResultOpen(true)}
          className="rounded-lg bg-[#5f6368] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#4b4f53] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-950"
        >
          Submit
        </button>
      </div>

      <TestResult
        open={resultOpen}
        onClose={() => setResultOpen(false)}
        onReview={() => {
          setResultOpen(false);
          goTo(0);
        }}
        onRetake={retake}
        canGrade={questions.every((q) => q.correctIndex !== undefined)}
        correct={questions.filter((q, i) => saved[i] !== undefined && saved[i] === q.correctIndex).length}
        incorrect={questions.filter((q, i) => saved[i] !== undefined && q.correctIndex !== undefined && saved[i] !== q.correctIndex).length}
        total={totalQuestions}
      />
    </div>
  );
}
