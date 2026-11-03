"use client";

import { SubjectIcon } from "@/components/common/subject-icon";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { Checkbox } from "@/components/ui/form-controls";
import { cn } from "@/lib/cn";
import { topicQuestionCount } from "@/lib/selectors";
import type { StepProps } from "./test-form-types";

// Step 2: which subjects and topics the test covers
export function StepScope({ values, errors, update }: StepProps) {
  const { subjects, topics, questions } = useAdminStore();

  const chosenSubjects = subjects.items.filter((subject) => values.subjectIds.includes(subject.id));

  function toggleSubject(subjectId: string) {
    const selected = values.subjectIds.includes(subjectId);
    const subjectIds = selected ? values.subjectIds.filter((id) => id !== subjectId) : [...values.subjectIds, subjectId];
    // Un-choosing a subject also drops its topics and their questions
    const keepTopic = (topicId: string) => topics.items.find((t) => t.id === topicId)?.subjectId !== subjectId || !selected;
    const topicIds = values.topicIds.filter(keepTopic);
    update({
      subjectIds,
      topicIds,
      questionIds: values.questionIds.filter((id) => topicIds.includes(questions.items.find((q) => q.id === id)?.topicId ?? "")),
    });
  }

  function setTopics(topicIds: string[]) {
    update({
      topicIds,
      questionIds: values.questionIds.filter((id) => topicIds.includes(questions.items.find((q) => q.id === id)?.topicId ?? "")),
    });
  }

  function toggleTopic(topicId: string) {
    setTopics(values.topicIds.includes(topicId) ? values.topicIds.filter((id) => id !== topicId) : [...values.topicIds, topicId]);
  }

  function toggleAllTopicsOf(subjectId: string) {
    const own = topics.items.filter((t) => t.subjectId === subjectId).map((t) => t.id);
    const allChosen = own.every((id) => values.topicIds.includes(id));
    setTopics(allChosen ? values.topicIds.filter((id) => !own.includes(id)) : [...new Set([...values.topicIds, ...own])]);
  }

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-slate-700">Subjects</legend>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.items.map((subject) => {
            const selected = values.subjectIds.includes(subject.id);
            return (
              <label
                key={subject.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors",
                  selected ? "border-indigo-500 bg-indigo-50/60" : "border-slate-200 hover:bg-slate-50",
                )}
              >
                <SubjectIcon icon={subject.icon} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{subject.name}</span>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleSubject(subject.id)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                />
              </label>
            );
          })}
        </div>
      </fieldset>

      <div>
        <p className="mb-3 text-sm font-medium text-slate-700">Topics</p>
        {chosenSubjects.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
            Choose a subject above to see its topics.
          </p>
        ) : (
          <div className="space-y-4">
            {chosenSubjects.map((subject) => {
              const own = topics.items.filter((t) => t.subjectId === subject.id);
              const allChosen = own.length > 0 && own.every((t) => values.topicIds.includes(t.id));
              return (
                <fieldset key={subject.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <legend className="text-sm font-semibold text-slate-900">{subject.name}</legend>
                    <button
                      type="button"
                      onClick={() => toggleAllTopicsOf(subject.id)}
                      disabled={own.length === 0}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:text-slate-400"
                    >
                      {allChosen ? "Clear all" : "Select all"}
                    </button>
                  </div>
                  {own.length === 0 ? (
                    <p className="text-sm text-slate-500">This subject has no topics yet.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {own.map((topic) => (
                        <Checkbox
                          key={topic.id}
                          label={topic.name}
                          description={`${topicQuestionCount(topic.id, questions.items)} questions`}
                          checked={values.topicIds.includes(topic.id)}
                          onChange={() => toggleTopic(topic.id)}
                        />
                      ))}
                    </div>
                  )}
                </fieldset>
              );
            })}
          </div>
        )}
      </div>

      {errors.scope ? (
        <p role="alert" className="text-sm font-medium text-red-600">
          {errors.scope}
        </p>
      ) : null}
    </div>
  );
}
