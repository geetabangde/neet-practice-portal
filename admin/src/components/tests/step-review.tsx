"use client";

import { useAdminStore } from "@/components/providers/admin-store-provider";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import type { TestFormValues } from "./test-form-types";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900">{children}</dd>
    </div>
  );
}

// Step 4: a summary of everything before saving
export function StepReview({ values }: { values: TestFormValues }) {
  const { subjects, topics } = useAdminStore();

  const totalQuestions = values.questionIds.length;
  const marksPerQuestion = Number(values.marksPerQuestion);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-indigo-50 p-4">
          <p className="text-sm text-indigo-700">Questions</p>
          <p className="mt-1 text-2xl font-semibold text-indigo-900">{totalQuestions}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-4">
          <p className="text-sm text-emerald-700">Total marks</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-900">{totalQuestions * marksPerQuestion}</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-4">
          <p className="text-sm text-amber-800">Duration</p>
          <p className="mt-1 text-2xl font-semibold text-amber-900">{values.durationMinutes} min</p>
        </div>
      </div>

      <dl className="mt-4 divide-y divide-slate-100">
        <Row label="Title">{values.title}</Row>
        <Row label="Description">{values.description || <span className="font-normal text-slate-400">No description</span>}</Row>
        <Row label="Subjects">
          <span className="flex flex-wrap gap-1.5">
            {subjects.items
              .filter((s) => values.subjectIds.includes(s.id))
              .map((s) => (
                <Badge key={s.id} tone="indigo">
                  {s.name}
                </Badge>
              ))}
          </span>
        </Row>
        <Row label="Topics">{topics.items.filter((t) => values.topicIds.includes(t.id)).length} topics</Row>
        <Row label="Marking">
          +{values.marksPerQuestion} for a correct answer,{" "}
          {Number(values.negativeMarking) > 0 ? `−${values.negativeMarking} for a wrong answer` : "no negative marking"}
        </Row>
        <Row label="Starts">{formatDateTime(values.startAt)}</Row>
        <Row label="Ends">{formatDateTime(values.endAt)}</Row>
      </dl>
    </div>
  );
}
