"use client";

import { useState } from "react";
import type { AnswerFeedback, Letter, PracticeQuestion } from "@/lib/studentContent";
import { BookmarkIcon, ClockIcon } from "./icons";
import QuestionImage from "./QuestionImage";
import RichText from "./RichText";
import Countdown from "./Countdown";
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
  durationMinutes?: number;
  // Sends the answer to the server, which marks it and saves it
  submit: SubmitAnswer;
  // Saves or removes the bookmark of a question. Leave it out to show no bookmark button.
  toggleBookmark?: ToggleBookmark;
};

const roundButtonClass =
  "inline-flex items-center gap-2 rounded px-6 py-2 text-xs font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5ec6e0] disabled:cursor-not-allowed disabled:opacity-50";

// Practice: one question at a time. A single-answer question is marked the moment an option is picked.
// A multiple-answer question lets the student pick several options and then press "Check answer".
// The right answer and the explanation come from the server only after the answer was sent.
export default function PracticeView({ title, questions, durationMinutes, submit, toggleBookmark }: PracticeViewProps) {
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

  const rightShare = result ? Math.round(result.feedback.correct.reduce((sum, l) => sum + (result.feedback.percents[l] ?? 0), 0) * 100) / 100 : 0;

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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="mr-auto">
          <h1 className="text-xl font-bold">{title}</h1>
          <h2 className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase text-slate-500">
            <span>MCQs · Question {index + 1} of {questions.length}</span>
            {durationMinutes ? (
              <>
                <span>·</span>
                <span className="text-slate-700">{durationMinutes} min</span>
              </>
            ) : null}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {durationMinutes ? (
            <div className="flex items-center gap-2 rounded-full border border-accent/40 bg-accent/5 px-4 py-2 text-xs font-semibold text-accent-dark" title="Time remaining for this topic">
              <ClockIcon className="h-4 w-4" />
              <span>Time Left: </span>
              <Countdown secondsLeft={durationMinutes * 60} onEnd={() => setResultOpen(true)} />
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium">
              <ClockIcon className="h-4 w-4" />
              <Timer key={index} />
            </div>
          )}
        </div>
      </div>

      <section aria-labelledby="practice-question" className="mx-auto mt-4 w-full max-w-5xl rounded-xl bg-white px-4 py-5 sm:px-8">
        <ol aria-label="Questions" className="flex flex-wrap gap-1">
          {questions.map((q, i) => {
            const a = answered[q.id];
            const color = a ? (a.feedback.isCorrect ? "bg-green-500" : "bg-red-400") : i === index ? "bg-slate-500" : "bg-slate-200";
            return (
              <li key={q.id}>
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Go to question ${i + 1}`}
                  aria-current={i === index ? "true" : undefined}
                  className="flex h-3 w-3 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <span className={`block rounded-full ${i === index ? "h-2.5 w-2.5" : "h-2 w-2"} ${color}`} />
                </button>
              </li>
            );
          })}
        </ol>

        <div className="mt-4 flex items-start justify-between gap-4">
          <h3 id="practice-question" className="text-base font-bold leading-snug text-slate-600">
            {index + 1}. {question.text}
          </h3>
          {toggleBookmark ? (
            <button
              suppressHydrationWarning
              type="button"
              aria-label={bookmarked[question.id] ? "Remove bookmark" : "Bookmark this question"}
              aria-pressed={bookmarked[question.id] === true}
              disabled={marking}
              onClick={() => void flipBookmark()}
              className={`flex shrink-0 flex-col items-center gap-0.5 rounded p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60 ${
                bookmarked[question.id] ? "text-accent-dark" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {/* Filled when the question is bookmarked, an outline when it is not */}
              <BookmarkIcon className="h-6 w-6" fill={bookmarked[question.id] ? "currentColor" : "none"} />
              <span className="text-[10px] font-medium">{marking ? "Saving..." : bookmarked[question.id] ? "Bookmarked" : "Bookmark"}</span>
            </button>
          ) : null}
        </div>

        {question.imageToken ? <QuestionImage key={question.id} token={question.imageToken} label={`Image for question ${index + 1}`} /> : null}

        <div
          role={question.type === "single" ? "radiogroup" : "group"}
          aria-labelledby="practice-question"
          className="mt-8 grid gap-4 md:grid-cols-2"
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
                className={`grid min-h-[3.25rem] grid-cols-[1fr_auto] items-start gap-3 rounded-sm px-4 py-3 text-left text-xs shadow-[0_1px_4px_rgba(0,0,0,0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  isRight ? "bg-[#fdfdee]" : selected && !result ? "bg-sky-50" : "bg-white hover:bg-slate-50"
                }`}
              >
                <span className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-3 w-3 shrink-0 items-center justify-center rounded-full border ${
                      selected ? "border-slate-500" : "border-slate-300"
                    }`}
                  >
                    {selected ? <span className="h-1.5 w-1.5 rounded-full bg-slate-500" /> : null}
                  </span>
                  <span>
                    <span className="font-semibold text-slate-700">
                      {letter}. <RichText value={question.options[letter]} inline />
                    </span>
                    {isRight ? (
                      <span className="mt-1 flex items-center gap-1 font-medium text-green-600">
                        <span aria-hidden="true">✔</span> Correct
                      </span>
                    ) : null}
                    {isWrong ? (
                      <span className="mt-1 flex items-center gap-1 font-medium text-red-600">
                        <span aria-hidden="true">✖</span> Incorrect
                      </span>
                    ) : null}
                  </span>
                </span>
                {/* How many students chose each option appears once the question is answered */}
                {result ? (
                  <span className={`text-[11px] ${isRight ? "text-[#b08a5b]" : "text-slate-400"}`}>{result.feedback.percents[letter].toFixed(2)}%</span>
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
            className={`${roundButtonClass} mt-5 bg-[#5ec6e0] text-white hover:bg-[#46b5d1]`}
          >
            {sending ? "Checking..." : "Check answer"}
          </button>
        ) : null}

        <div role="status" aria-live="polite">
          {error ? <p className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error}</p> : null}
        </div>

        {result ? (
          <div className="mt-6">
            <p className="flex items-center gap-2 text-xs text-slate-800">
              <span
                aria-hidden="true"
                className="inline-block h-4 w-4 rounded-full"
                style={{ background: `conic-gradient(#8bc34a ${rightShare * 3.6}deg, #e5e7eb 0)` }}
              />
              {rightShare}% answered this question correctly.
            </p>

            <p className="mt-5 text-[11px] text-slate-500">Explanation</p>
            {result.feedback.explanation ? (
              <RichText value={result.feedback.explanation} className="mt-3 max-w-2xl text-xs leading-relaxed text-slate-800" />
            ) : (
              <p className="mt-3 text-xs text-slate-500">No explanation was added for this question.</p>
            )}
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

      <div className="sticky bottom-0 z-10 mx-auto mt-6 flex w-full max-w-5xl items-center justify-end gap-3 bg-white px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.12)]">
        <button
          suppressHydrationWarning
          type="button"
          disabled={index === 0}
          onClick={() => goTo(index - 1)}
          className={`${roundButtonClass} border border-slate-200 bg-white text-[#5ec6e0] hover:bg-slate-50`}
        >
          Previous
        </button>
        <button
          suppressHydrationWarning
          type="button"
          disabled={sending}
          onClick={() => (isLast ? setResultOpen(true) : goTo(index + 1))}
          className={`${roundButtonClass} bg-[#5ec6e0] px-8 text-white hover:bg-[#46b5d1]`}
        >
          {isLast ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}
