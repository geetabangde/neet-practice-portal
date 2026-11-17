"use client";

import Link from "next/link";
import { useCallback } from "react";
import { fetchBookmarkedModule } from "@/lib/studentContent";
import { useStudentFetch } from "@/lib/useStudentFetch";
import PracticeView from "./PracticeView";
import { useSubmitAnswer } from "./useSubmitAnswer";
import { useToggleBookmark } from "./useToggleBookmark";

const messageClass = "mt-5 rounded-xl bg-white p-6 text-sm text-slate-600";

function Breadcrumb({ name }: { name: string }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href="/dashboard" className="text-accent-dark hover:underline">
            QBank
          </Link>
        </li>
        <li aria-hidden="true">&gt;</li>
        <li>
          <Link href="/dashboard/bookmarks" className="text-accent-dark hover:underline">
            Bookmarks
          </Link>
        </li>
        <li aria-hidden="true">&gt;</li>
        <li aria-current="page">{name}</li>
      </ol>
    </nav>
  );
}

// The bookmarked questions of one module, practised like any other questions
export default function BookmarkedPractice({ moduleId }: { moduleId: string }) {
  // useCallback keeps the same function between renders, so the page loads once, not on every render
  const load = useCallback((token: string) => fetchBookmarkedModule(token, moduleId), [moduleId]);
  const { state, reload } = useStudentFetch(load);
  const submit = useSubmitAnswer();
  const toggleBookmark = useToggleBookmark();

  if (state.status === "loading") {
    return (
      <>
        <Breadcrumb name="..." />
        <p role="status" className={messageClass}>
          Loading your bookmarked questions...
        </p>
      </>
    );
  }

  if (state.status === "notFound") {
    return (
      <>
        <Breadcrumb name="Not found" />
        <p role="alert" className={messageClass}>
          There are no bookmarks here (any more).{" "}
          <Link href="/dashboard/bookmarks" className="font-semibold text-accent-dark hover:underline">
            Back to bookmarks
          </Link>
        </p>
      </>
    );
  }

  if (state.status === "error") {
    return (
      <>
        <Breadcrumb name="Error" />
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
      </>
    );
  }

  const { module, questions } = state.data;

  return (
    <>
      <Breadcrumb name={module.name} />
      <p className="mt-4 text-xs font-semibold uppercase text-accent">{module.subjectName}</p>
      <div className="mt-1 flex flex-1 flex-col">
        {/* key: another module starts from its first question */}
        <PracticeView key={module.id} title={module.name} questions={questions} submit={submit} toggleBookmark={toggleBookmark} />
      </div>
    </>
  );
}
