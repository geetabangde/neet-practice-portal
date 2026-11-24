"use client";

import Link from "next/link";
import { useCallback } from "react";
import { fetchSubjectWithModules } from "@/lib/studentContent";
import { topicLook } from "@/lib/subjectLook";
import { useStudentFetch } from "@/lib/useStudentFetch";
import TopicCard from "./TopicCard";

const messageClass = "mt-5 rounded-xl bg-white p-6 text-sm text-slate-600";

function Breadcrumb({ name }: { name: string }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs">
      <ol className="flex items-center gap-2">
        <li>
          <Link href="/dashboard" className="text-accent-dark hover:underline">
            QBank
          </Link>
        </li>
        <li aria-hidden="true">&gt;</li>
        <li aria-current="page">{name}</li>
      </ol>
    </nav>
  );
}

// A subject page: its name, its modules, and the topics inside each module. Loaded from the server by the
// subject's slug.
export default function SubjectTopics({ slug }: { slug: string }) {
  // useCallback keeps the same function between renders, so the page loads once, not on every render
  const load = useCallback((token: string) => fetchSubjectWithModules(token, slug), [slug]);
  const { state, reload } = useStudentFetch(load);

  if (state.status === "loading") {
    return (
      <>
        <Breadcrumb name="..." />
        <p role="status" className={messageClass}>
          Loading modules...
        </p>
      </>
    );
  }

  if (state.status === "notFound") {
    return (
      <>
        <Breadcrumb name="Not found" />
        <p role="alert" className={messageClass}>
          This subject was not found. It may have been removed.{" "}
          <Link href="/dashboard" className="font-semibold text-accent-dark hover:underline">
            Back to subjects
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

  const { subject, modules } = state.data;

  return (
    <>
      <Breadcrumb name={subject.name} />

      <h1 className="mt-4 text-2xl font-bold">{subject.name}</h1>
      <h2 className="mt-1 text-xs font-semibold uppercase">Modules</h2>

      {modules.length === 0 ? (
        <p className={messageClass}>Modules for {subject.name} will be added soon.</p>
      ) : (
        <div className="mt-5 space-y-8">
          {modules.map((module) => (
            <section key={module.id} aria-labelledby={`module-${module.id}`}>
              <div className="flex flex-wrap items-baseline gap-x-3">
                <h3 id={`module-${module.id}`} className="text-lg font-semibold">
                  {module.name}
                </h3>
                <p className="text-xs text-black/70">
                  {module.topics.length} {module.topics.length === 1 ? "topic" : "topics"} · {module.questionCount} MCQs · {module.answeredCount} done
                </p>
              </div>

              {module.topics.length > 0 ? (
                <ul className="mt-3 grid gap-4 md:grid-cols-2">
                  {module.topics.map((topic) => (
                    <TopicCard
                      key={topic.id}
                      topic={{
                        name: topic.name,
                        mcqs: topic.questionCount,
                        durationMinutes: topic.durationMinutes,
                        done: topic.answeredCount,
                        ...topicLook(subject.slug, topic.name),
                      }}
                      href={`/dashboard/${subject.slug}/topics/${topic.id}`}
                    />
                  ))}
                </ul>
              ) : (
                <p className="mt-3 rounded-xl bg-white p-4 text-sm text-slate-600">Topics for this module will be added soon.</p>
              )}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
