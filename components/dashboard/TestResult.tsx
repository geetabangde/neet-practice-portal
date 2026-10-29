"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CloseIcon } from "./icons";

type TestResultProps = {
  open: boolean;
  onClose: () => void;
  onReview: () => void;
  onRetake: () => void;
  // False when the questions have no answer key, so nothing can be graded
  canGrade: boolean;
  correct: number;
  incorrect: number;
  total: number;
  // Rank among other students. Needs a backend, so it is empty for now.
  position?: number;
};

const RADIUS = 15;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ScoreRing({ percent }: { percent: number }) {
  return (
    <div className="relative h-11 w-11 shrink-0" aria-hidden="true">
      <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90">
        <circle cx="20" cy="20" r={RADIUS} fill="none" strokeWidth="4" className="stroke-slate-200" />
        <circle
          cx="20"
          cy="20"
          r={RADIUS}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${(percent / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          className="stroke-accent"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold">
        {percent}%
      </span>
    </div>
  );
}

function StatCard({ icon, value, label, valueClass }: {
  icon: ReactNode;
  value: string;
  label: string;
  valueClass: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm">
      {icon}
      <div>
        <p className={`text-base font-semibold leading-tight ${valueClass}`}>{value}</p>
        <p className="text-[11px] text-black/80">{label}</p>
      </div>
    </div>
  );
}

const iconCircle = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white";

export default function TestResult({
  open,
  onClose,
  onReview,
  onRetake,
  canGrade,
  correct,
  incorrect,
  total,
  position,
}: TestResultProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const percent = canGrade ? Math.round((correct / total) * 100) : 0;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      aria-labelledby="result-title"
      className="m-auto w-[calc(100%-2rem)] max-w-3xl rounded-2xl bg-tint p-0 text-brand-950 shadow-2xl backdrop:bg-black/50"
    >
      <div className="relative p-6 sm:p-8">
        <button
          suppressHydrationWarning
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-5 top-5 rounded-lg p-1 hover:bg-slate-200/60 focus-visible:outline-2 focus-visible:outline-accent"
        >
          <CloseIcon className="h-6 w-6" />
        </button>

        <svg viewBox="0 0 64 64" className="mx-auto h-16 w-16" aria-hidden="true">
          <path
            fill="#16a34a"
            d="M32 2l6.4 4.6 7.9-.2 2.4 7.5 6.4 4.6-2.5 7.5 2.5 7.5-6.4 4.6-2.4 7.5-7.9-.2L32 62l-6.4-4.6-7.9.2-2.4-7.5-6.4-4.6 2.5-7.5-2.5-7.5 6.4-4.6 2.4-7.5 7.9.2L32 2Z"
          />
          <circle cx="32" cy="32" r="19" fill="#fff" />
          <path
            d="m22 32.5 7 7 13-14"
            fill="none"
            stroke="#16a34a"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <h2 id="result-title" className="mt-3 text-center text-2xl font-semibold">
          Test Completed
        </h2>
        <p className="mt-1 text-center text-xs">Great effort, keep going!</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={canGrade ? <ScoreRing percent={percent} /> : <span className="h-11 w-11" aria-hidden="true" />}
            value={canGrade ? `${percent}%` : "--"}
            label="Score"
            valueClass="text-accent"
          />
          <StatCard
            icon={
              <span className={`${iconCircle} bg-accent`}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <rect x="4" y="14" width="3.5" height="6" rx="1" />
                  <rect x="10.2" y="9" width="3.5" height="11" rx="1" />
                  <rect x="16.5" y="4" width="3.5" height="16" rx="1" />
                </svg>
              </span>
            }
            value={position === undefined ? "--" : `#${position}`}
            label="Your position"
            valueClass=""
          />
          <StatCard
            icon={
              <span className={`${iconCircle} bg-green-500`}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m5 12.5 4.5 4.5L19 7.5" />
                </svg>
              </span>
            }
            value={canGrade ? pad(correct) : "--"}
            label="Correct"
            valueClass="text-green-600"
          />
          <StatCard
            icon={
              <span className={`${iconCircle} bg-red-500`}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" aria-hidden="true">
                  <path d="M7 7l10 10M17 7 7 17" />
                </svg>
              </span>
            }
            value={canGrade ? pad(incorrect) : "--"}
            label="Incorrect"
            valueClass="text-red-500"
          />
        </div>

        {!canGrade ? (
          <p className="mt-4 text-center text-xs text-slate-600">
            The answer key for these questions is not added yet, so the test cannot be graded.
          </p>
        ) : null}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button
            suppressHydrationWarning
            type="button"
            onClick={onReview}
            className="rounded-lg border border-accent bg-white px-4 py-2.5 text-xs font-semibold hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Review answer
          </button>
          <button
            suppressHydrationWarning
            type="button"
            onClick={onRetake}
            className="rounded-lg bg-accent px-4 py-2.5 text-xs font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Retake Test
          </button>
        </div>
      </div>
    </dialog>
  );
}
