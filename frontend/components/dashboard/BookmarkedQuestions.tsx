"use client";

import { useState } from "react";
import type { SubjectQuestion } from "@/types/dashboard";
import { ArrowLeftIcon, ArrowRightIcon } from "./icons";

const LETTERS = ["A", "B", "C", "D", "E"];

type BookmarkedQuestionsProps = {
  subjectName: string;
  // Bookmarks in the whole set. Only some questions may be loaded so far.
  total: number;
  questions: SubjectQuestion[];
};

// Read-only view of saved questions: the percentages are shown right away
export default function BookmarkedQuestions({ subjectName, total, questions }: BookmarkedQuestionsProps) {
  const [index, setIndex] = useState(0);
  const question = questions[index];

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="mt-4 text-2xl font-bold">{subjectName}</h1>
      <p className="mt-1 text-xs font-semibold uppercase">Total : {Math.max(total, questions.length)}</p>

      <section aria-labelledby="bookmarked-question" className="mt-5 rounded-xl bg-white p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-accent text-[11px] font-medium text-white">
            {index + 1}
          </span>
          <h2 id="bookmarked-question" className="text-base font-semibold leading-snug">
            {question.text}
          </h2>
        </div>

        <ul className="mt-5 space-y-3">
          {question.options.map((option, i) => (
            <li
              key={option.text}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-medium text-accent-dark">
                {LETTERS[i]}
              </span>
              <span className="flex-1">{option.text}</span>
              <span className="text-sm font-medium">{option.percent.toFixed(2)}%</span>
            </li>
          ))}
        </ul>
      </section>

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
          disabled={index === questions.length - 1}
          onClick={() => setIndex(index + 1)}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-8 py-2.5 text-xs font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
