"use client";

import { useState } from "react";
import { DifficultyBadge } from "@/components/common/status-badges";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form-controls";
import { SearchInput } from "@/components/ui/search-input";
import { indexById } from "@/lib/selectors";
import type { StepProps } from "./test-form-types";

// Step 3: pick the questions. Only published questions from the chosen topics are offered,
// plus the ones this test already has.
export function StepQuestions({ values, errors, update }: StepProps) {
  const { questions, topics } = useAdminStore();
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");

  const topicById = indexById(topics.items);
  const term = query.trim().toLowerCase();

  const available = questions.items.filter(
    (q) => (q.status === "published" && values.topicIds.includes(q.topicId)) || values.questionIds.includes(q.id),
  );
  const shown = available.filter(
    (q) => (difficulty === "all" || q.difficulty === difficulty) && (!term || q.text.toLowerCase().includes(term) || q.id.includes(term)),
  );

  const selected = new Set(values.questionIds);
  const allShownSelected = shown.length > 0 && shown.every((q) => selected.has(q.id));

  function toggle(id: string) {
    update({ questionIds: selected.has(id) ? values.questionIds.filter((x) => x !== id) : [...values.questionIds, id] });
  }

  function toggleShown() {
    const shownIds = shown.map((q) => q.id);
    update({
      questionIds: allShownSelected
        ? values.questionIds.filter((id) => !shownIds.includes(id))
        : [...new Set([...values.questionIds, ...shownIds])],
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search questions" className="w-full sm:w-64" />
        <div className="w-full sm:w-44">
          <Select aria-label="Filter by difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="all">All difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Button variant="outline" size="sm" onClick={toggleShown} disabled={shown.length === 0}>
            {allShownSelected ? "Unselect shown" : "Select all shown"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => update({ questionIds: [] })} disabled={values.questionIds.length === 0}>
            Clear
          </Button>
        </div>
      </div>

      <p className="text-sm text-slate-600" aria-live="polite">
        <strong className="text-slate-900">{values.questionIds.length}</strong> selected · {available.length} available in the chosen topics
      </p>

      {available.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
          The chosen topics have no published questions. Go back and choose other topics, or publish some questions first.
        </p>
      ) : shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
          No questions match your search.
        </p>
      ) : (
        <ul className="max-h-[26rem] divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
          {shown.map((question) => (
            <li key={question.id}>
              <label className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={selected.has(question.id)}
                  onChange={() => toggle(question.id)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-slate-900">{question.text}</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {question.id} · {topicById.get(question.topicId)?.name ?? "—"}
                  </span>
                </span>
                <DifficultyBadge status={question.difficulty} />
              </label>
            </li>
          ))}
        </ul>
      )}

      {errors.questions ? (
        <p role="alert" className="text-sm font-medium text-red-600">
          {errors.questions}
        </p>
      ) : null}
    </div>
  );
}
