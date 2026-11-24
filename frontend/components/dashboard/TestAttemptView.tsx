"use client";

import Link from "next/link";
import { useCallback } from "react";
import { startTestAttempt } from "@/lib/studentContent";
import { useStudentFetch } from "@/lib/useStudentFetch";
import TestAttempt from "./TestAttempt";

const messageClass = "m-6 rounded-xl bg-slate-50 p-6 text-sm text-slate-600";

// Opens a test for the signed-in student: starts it, or continues the attempt that is already there
export default function TestAttemptView({ testId }: { testId: string }) {
  // useCallback keeps the same function between renders, so the test starts once, not on every render
  const load = useCallback((token: string) => startTestAttempt(token, testId), [testId]);
  const { state, reload } = useStudentFetch(load);

  if (state.status === "loading") {
    return (
      <p role="status" className={messageClass}>
        Opening your test...
      </p>
    );
  }

  if (state.status === "notFound") {
    return (
      <p role="alert" className={messageClass}>
        This test was not found.{" "}
        <Link href="/dashboard/test-series" className="font-semibold text-accent-dark hover:underline">
          Back to Test Series
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
        {state.message.includes("paid plan") ? (
          <Link href="/dashboard/plans" className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white hover:bg-accent-dark">
            View plans
          </Link>
        ) : null}
        <Link href="/dashboard/test-series" className="font-semibold text-accent-dark hover:underline">
          Back to Test Series
        </Link>
      </div>
    );
  }

  return <TestAttempt key={state.data.attempt.id} attempt={state.data.attempt} />;
}
