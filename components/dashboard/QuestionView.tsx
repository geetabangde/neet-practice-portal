"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { SubjectQuestion } from "@/types/dashboard";
import QuestionNavigator from "./QuestionNavigator";
import TestResult from "./TestResult";
import { ArrowLeftIcon, ArrowRightIcon, BookmarkIcon, ClockIcon, NotesIcon } from "./icons";

const LETTERS = ["A", "B", "C", "D", "E"];

// Counts up from 0. The parent gives it a new `key` per question, so it restarts.
function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <span className="tabular-nums" role="timer" aria-label="Time on this question">
      {mm}:{ss}
    </span>
  );
}

const roundButtonClass =
  "flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

type QuestionViewProps = {
  subjectName: string;
  // Questions in the whole module. Only some may be loaded so far.
  total: number;
  questions: SubjectQuestion[];
};

export default function QuestionView({ subjectName, total, questions }: QuestionViewProps) {
  const [index, setIndex] = useState(0);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  // After "Review answer", the right and wrong options are marked
  const [reviewing, setReviewing] = useState(false);
  // Chosen option per question (by question index)
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [bookmarked, setBookmarked] = useState<Record<number, boolean>>({});

  const question = questions[index];
  const answer = answers[index];
  const isBookmarked = bookmarked[index] === true;
  const totalQuestions = Math.max(total, questions.length);
  const isLast = index === questions.length - 1;
  const progress = ((index + 1) / totalQuestions) * 100;

  // Grading needs an answer key on every question
  const canGrade = questions.every((q) => q.correctIndex !== undefined);
  const correctCount = questions.filter((q, i) => answers[i] !== undefined && answers[i] === q.correctIndex).length;
  const incorrectCount = questions.filter(
    (q, i) => answers[i] !== undefined && q.correctIndex !== undefined && answers[i] !== q.correctIndex,
  ).length;

  function retake() {
    setAnswers({});
    setBookmarked({});
    setIndex(0);
    setReviewing(false);
    setResultOpen(false);
  }

  function review() {
    setIndex(0);
    setReviewing(true);
    setResultOpen(false);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-bold">{subjectName}</h1>
          <h2 className="mt-1 text-xs font-semibold uppercase">MCQs</h2>
        </div>

        <div className="flex w-full items-center gap-4 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-medium sm:w-auto sm:min-w-72 sm:flex-1 sm:max-w-md lg:max-w-xs xl:max-w-md">
          <span className="whitespace-nowrap">
            Question {index + 1} of {totalQuestions}
          </span>
          <div
            role="progressbar"
            aria-label="Module progress"
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
          <Timer key={index} />
        </div>

        <button
          suppressHydrationWarning
          type="button"
          aria-label="Question navigator"
          onClick={() => setNavigatorOpen(true)}
          className={roundButtonClass}
        >
          <NotesIcon className="h-4 w-4" />
        </button>
        <button
          suppressHydrationWarning
          type="button"
          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this question"}
          aria-pressed={isBookmarked}
          onClick={() => setBookmarked((prev) => ({ ...prev, [index]: !isBookmarked }))}
          className={`flex h-10 w-10 items-center justify-center rounded-full border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            isBookmarked
              ? "border-accent bg-accent text-white"
              : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <BookmarkIcon className="h-4 w-4" />
        </button>
      </div>

      <section aria-labelledby="question-text" className="mt-4 rounded-xl bg-white p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-accent text-[11px] font-medium text-white">
            {index + 1}
          </span>
          <h3 id="question-text" className="text-base font-semibold leading-snug">
            {question.text}
          </h3>
        </div>

        {question.image ? (
          <div className="mt-4 flex h-36 w-full max-w-60 items-center justify-center rounded-lg bg-accent-soft p-2">
            <Image
              src={`/modules/${question.image}.png`}
              alt=""
              width={320}
              height={200}
              className="h-full w-full object-contain"
            />
          </div>
        ) : null}

        <div role="radiogroup" aria-labelledby="question-text" className="mt-5 space-y-3">
          {question.options.map((option, i) => {
            const selected = answer === i;
            const isRight = reviewing && question.correctIndex === i;
            const isWrong = reviewing && selected && question.correctIndex !== undefined && question.correctIndex !== i;
            return (
              <button
                suppressHydrationWarning
                key={option.text}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setAnswers((prev) => ({ ...prev, [index]: i }))}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  isRight
                    ? "border-green-500 bg-green-50"
                    : isWrong
                      ? "border-red-400 bg-red-50"
                      : selected
                        ? "border-accent bg-accent-soft"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    selected ? "bg-accent text-white" : "bg-accent-soft text-accent-dark"
                  }`}
                >
                  {LETTERS[i]}
                </span>
                <span className="flex-1">{option.text}</span>
                {/* Percentages appear once the question is answered */}
                {answer !== undefined ? (
                  <span className="text-sm font-medium">{option.percent.toFixed(2)}%</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <QuestionNavigator
        open={navigatorOpen}
        onClose={() => setNavigatorOpen(false)}
        total={totalQuestions}
        questions={questions}
        answers={answers}
        bookmarked={bookmarked}
        current={index}
        onSelect={(i) => {
          setIndex(i);
          setNavigatorOpen(false);
        }}
      />

      <TestResult
        open={resultOpen}
        onClose={() => setResultOpen(false)}
        onReview={review}
        onRetake={retake}
        canGrade={canGrade}
        correct={correctCount}
        incorrect={incorrectCount}
        total={totalQuestions}
      />

      <div className="mt-auto flex items-center justify-between pt-6">
        <button
          suppressHydrationWarning
          type="button"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
          className="inline-flex items-center gap-2 rounded-lg border border-accent bg-white px-5 py-2.5 text-xs font-semibold hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Previous
        </button>
        <button
          suppressHydrationWarning
          type="button"
          onClick={() => (isLast ? setResultOpen(true) : setIndex(index + 1))}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-8 py-2.5 text-xs font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLast ? "Finish" : "Next"}
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
