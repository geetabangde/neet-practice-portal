"use client";

import { useEffect, useRef } from "react";
import type { SubjectQuestion } from "@/types/dashboard";
import { BookmarkIcon, CloseIcon } from "./icons";

type Status = "correct" | "incorrect" | "answered" | "unattempted";

const tileClass: Record<Status, string> = {
  correct: "bg-[#d3f1de]",
  incorrect: "bg-[#fbd5d9]",
  // Answered, but there is no answer key to grade it against
  answered: "bg-accent-soft",
  unattempted: "bg-[#e2e5e9]",
};

type QuestionNavigatorProps = {
  open: boolean;
  onClose: () => void;
  total: number;
  questions: SubjectQuestion[];
  answers: Record<number, number>;
  bookmarked: Record<number, boolean>;
  current: number;
  onSelect: (index: number) => void;
};

function getStatus(question: SubjectQuestion, answer: number | undefined): Status {
  if (answer === undefined) return "unattempted";
  if (question.correctIndex === undefined) return "answered";
  return answer === question.correctIndex ? "correct" : "incorrect";
}

const legendPill =
  "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium";

// A native <dialog> gives focus trapping and the Esc key for free
export default function QuestionNavigator({
  open,
  onClose,
  total,
  questions,
  answers,
  bookmarked,
  current,
  onSelect,
}: QuestionNavigatorProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const statuses = Array.from({ length: total }, (_, i) =>
    questions[i] ? getStatus(questions[i], answers[i]) : null,
  );
  const hasUngraded = statuses.includes("answered");

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // A click on the dark backdrop lands on the <dialog> element itself
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      aria-labelledby="navigator-title"
      className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl bg-tint p-0 text-brand-950 shadow-2xl backdrop:bg-black/50"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 id="navigator-title" className="text-2xl font-semibold">
            Question Navigator
          </h2>
          <button
            suppressHydrationWarning
            type="button"
            onClick={onClose}
            aria-label="Close navigator"
            className="rounded-lg p-1 hover:bg-slate-200/60 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        <ul className="mt-5 flex flex-wrap gap-2">
          <li className={legendPill}>
            <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
            Correct
          </li>
          <li className={legendPill}>
            <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
            Incorrect
          </li>
          <li className={legendPill}>
            <span className="h-2 w-2 rounded-full bg-slate-300" aria-hidden="true" />
            Unattempted
          </li>
          {hasUngraded ? (
            <li className={legendPill}>
              <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
              Answered
            </li>
          ) : null}
          <li className={legendPill}>
            <BookmarkIcon className="h-3.5 w-3.5" />
            Bookmarked
          </li>
        </ul>

        <ol className="mt-6 flex flex-wrap gap-2">
          {statuses.map((status, i) => {
            const loaded = status !== null;
            const isCurrent = i === current;
            return (
              <li key={i}>
                <button
                  suppressHydrationWarning
                  type="button"
                  disabled={!loaded}
                  onClick={() => onSelect(i)}
                  aria-current={isCurrent ? "true" : undefined}
                  aria-label={`Question ${i + 1}${status ? `, ${status}` : ", not available yet"}${
                    bookmarked[i] ? ", bookmarked" : ""
                  }`}
                  className={`relative flex h-8 w-8 items-center justify-center rounded text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 ${
                    tileClass[status ?? "unattempted"]
                  } ${isCurrent ? "border-2 border-red-400" : ""}`}
                >
                  {i + 1}
                  {bookmarked[i] ? (
                    <BookmarkIcon className="absolute -right-1 -top-1 h-3 w-3 fill-accent text-accent" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </dialog>
  );
}
