"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { clearToken, getToken } from "@/lib/studentAuth";
import { fetchTopicQuestions, submitAnswer, type Letter } from "@/lib/studentContent";
import { useStudentFetch } from "@/lib/useStudentFetch";
import PracticeView, { type SubmitAnswer } from "./PracticeView";

const messageClass = "mt-5 rounded-xl bg-white p-6 text-sm text-slate-600";

function Breadcrumb({ slug, subjectName, topicName }: { slug: string; subjectName?: string; topicName: string }) {
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
          <Link href={`/dashboard/${slug}`} className="text-accent-dark hover:underline">
            {subjectName ?? "Subject"}
          </Link>
        </li>
        <li aria-hidden="true">&gt;</li>
        <li aria-current="page">{topicName}</li>
      </ol>
    </nav>
  );
}

// The practice page of one topic: loads its published questions from the server and lets the student answer them
export default function TopicPractice({ slug, topicId }: { slug: string; topicId: string }) {
  const router = useRouter();
  // useCallback keeps the same function between renders, so the page loads once, not on every render
  const load = useCallback((token: string) => fetchTopicQuestions(token, topicId), [topicId]);
  const { state, reload } = useStudentFetch(load);

  // Sends one answer to the server. A refused login sends the student back to /login.
  const submit: SubmitAnswer = async (questionId: number, selected: Letter[]) => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return { ok: false, message: "Please log in again." };
    }
    const result = await submitAnswer(token, questionId, selected);
    if (result.ok) return { ok: true, feedback: result.data };
    if (result.status === 401 || result.status === 403) {
      clearToken();
      router.replace("/login");
    }
    return { ok: false, message: result.message };
  };

  if (state.status === "loading") {
    return (
      <>
        <Breadcrumb slug={slug} topicName="..." />
        <p role="status" className={messageClass}>
          Loading questions...
        </p>
      </>
    );
  }

  if (state.status === "notFound") {
    return (
      <>
        <Breadcrumb slug={slug} topicName="Not found" />
        <p role="alert" className={messageClass}>
          This topic was not found. It may have been removed.{" "}
          <Link href={`/dashboard/${slug}`} className="font-semibold text-accent-dark hover:underline">
            Back to the subject
          </Link>
        </p>
      </>
    );
  }

  if (state.status === "error") {
    return (
      <>
        <Breadcrumb slug={slug} topicName="Error" />
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

  const { topic, questions } = state.data;

  return (
    <>
      <Breadcrumb slug={topic.subjectSlug} subjectName={topic.subjectName} topicName={topic.name} />

      {questions.length === 0 ? (
        <>
          <h1 className="mt-4 text-2xl font-bold">{topic.name}</h1>
          <p className={messageClass}>Questions for this topic will be added soon.</p>
        </>
      ) : (
        <div className="mt-4 flex flex-1 flex-col">
          {/* key: a different topic starts the session from the first question */}
          <PracticeView key={topic.id} title={topic.name} questions={questions} submit={submit} />
        </div>
      )}
    </>
  );
}
