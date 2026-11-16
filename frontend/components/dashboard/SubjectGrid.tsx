"use client";

import { fetchSubjects } from "@/lib/studentContent";
import { subjectLook } from "@/lib/subjectLook";
import { useStudentFetch } from "@/lib/useStudentFetch";
import SubjectCard from "./SubjectCard";

// The share of a subject's questions this student has answered, in percent
function progressPercent(answered: number, total: number): number {
  return total === 0 ? 0 : Math.min(100, Math.round((answered / total) * 100));
}

const messageClass = "mt-4 rounded-xl bg-white p-6 text-sm text-slate-600";

// The subject cards on the dashboard, loaded from the server
export default function SubjectGrid() {
  const { state, reload } = useStudentFetch(fetchSubjects);

  if (state.status === "loading") {
    return (
      <p role="status" className={messageClass}>
        Loading subjects...
      </p>
    );
  }

  if (state.status !== "ready") {
    return (
      <div role="alert" className={`${messageClass} flex flex-wrap items-center gap-3`}>
        {state.status === "error" ? state.message : "Subjects could not be loaded."}
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

  const { subjects } = state.data;
  if (subjects.length === 0) return <p className={messageClass}>No subjects have been added yet.</p>;

  return (
    <ul className="mt-4 grid gap-4 sm:grid-cols-2">
      {subjects.map((subject) => {
        const look = subjectLook(subject.slug, subject.id);
        return (
          <SubjectCard
            key={subject.id}
            subject={{
              name: subject.name,
              slug: subject.slug,
              icon: look.icon,
              toneClass: look.toneClass,
              caption: `${subject.moduleCount} ${subject.moduleCount === 1 ? "module" : "modules"} · ${subject.topicCount} ${subject.topicCount === 1 ? "topic" : "topics"} · ${subject.questionCount} MCQs`,
              percent: progressPercent(subject.answeredCount, subject.questionCount),
            }}
          />
        );
      })}
    </ul>
  );
}
