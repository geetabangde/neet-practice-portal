"use client";

import { fetchBookmarks } from "@/lib/studentContent";
import { useStudentFetch } from "@/lib/useStudentFetch";
import BookmarkList from "./BookmarkList";

const messageClass = "mt-5 rounded-xl bg-white p-6 text-sm text-slate-600";

// The Bookmarks page: loads the student's bookmarks from the server
export default function BookmarksView() {
  const { state, reload } = useStudentFetch(fetchBookmarks);

  if (state.status === "loading") {
    return (
      <p role="status" className={messageClass}>
        Loading your bookmarks...
      </p>
    );
  }

  if (state.status !== "ready") {
    return (
      <div role="alert" className={`${messageClass} flex flex-wrap items-center gap-3`}>
        {state.status === "error" ? state.message : "Your bookmarks could not be loaded."}
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

  if (state.data.bookmarks.length === 0) {
    return (
      <>
        <h1 className="mt-4 text-2xl font-bold">Bookmarks</h1>
        <p className="mt-1 text-xs font-semibold uppercase">Total : 0</p>
        <p className={messageClass}>You have no bookmarks yet. Press the bookmark button on a question while you practise, and it will be saved here.</p>
      </>
    );
  }

  return <BookmarkList groups={state.data.bookmarks} />;
}
