"use client";

import Link from "next/link";
import { useCallback } from "react";
import { fetchCustomModule } from "@/lib/studentContent";
import { useStudentFetch } from "@/lib/useStudentFetch";
import PracticeView from "./PracticeView";
import { useSubmitAnswer } from "./useSubmitAnswer";
import { useToggleBookmark } from "./useToggleBookmark";

const messageClass = "rounded-xl bg-white p-6 text-sm text-slate-600";

// Solving a custom module: its saved questions, answered the same way as in a topic practice
export default function CustomModuleSolve({ id }: { id: string }) {
  // useCallback keeps the same function between renders, so the page loads once, not on every render
  const load = useCallback((token: string) => fetchCustomModule(token, id), [id]);
  const { state, reload } = useStudentFetch(load);
  const submit = useSubmitAnswer();
  const toggleBookmark = useToggleBookmark();

  if (state.status === "loading") {
    return (
      <p role="status" className={messageClass}>
        Loading your module...
      </p>
    );
  }

  if (state.status === "notFound") {
    return (
      <p role="alert" className={messageClass}>
        This custom module was not found.{" "}
        <Link href="/dashboard/custom-module" className="font-semibold text-accent-dark hover:underline">
          Create a new one
        </Link>
      </p>
    );
  }

  if (state.status === "error") {
    return (
      <div role="alert" className={`${messageClass} flex flex-wrap items-center gap-3`}>
        {state.message}
        <button
          suppressHydrationWarning
          type="button"
          onClick={reload}
          className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Try again
        </button>
      </div>
    );
  }

  const { module, questions } = state.data;

  if (questions.length === 0) {
    return (
      <p className={messageClass}>
        None of the questions of this module are available any more.{" "}
        <Link href="/dashboard/custom-module" className="font-semibold text-accent-dark hover:underline">
          Create a new one
        </Link>
      </p>
    );
  }

  return <PracticeView key={module.id} title="Custom Module" questions={questions} submit={submit} toggleBookmark={toggleBookmark} />;
}
