"use client";

import { ArrowLeft, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { DifficultyBadge, QuestionStatusBadge, TestStatusBadge } from "@/components/common/status-badges";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/form-controls";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { usePagination } from "@/hooks/use-pagination";
import { plural } from "@/lib/format";
import { indexById } from "@/lib/selectors";
import { updateTest } from "@/lib/tests-api";
import type { MockTest } from "@/types";

const PAGE_SIZE = 20;

// The page behind the "Questions" button of a test: choose which questions the test has.
export function TestQuestions({ id }: { id: string }) {
  const { tests, contentStatus, reloadContent } = useAdminStore();
  const test = tests.items.find((t) => t.id === id);

  // Opened straight from a link: wait for the server before saying the test is missing
  if (!test && contentStatus === "loading") {
    return (
      <p role="status" className="py-16 text-center text-sm text-slate-500">
        Loading test…
      </p>
    );
  }
  if (!test) {
    return (
      <Card>
        <EmptyState
          icon={ClipboardList}
          title={contentStatus === "error" ? "Could not load the test" : "Test not found"}
          description={contentStatus === "error" ? "The server did not respond. Check that the backend is running." : "This test does not exist. It may have been deleted."}
          action={
            contentStatus === "error" ? (
              <Button onClick={reloadContent}>Try again</Button>
            ) : (
              <Link href="/tests" className={buttonStyles()}>
                Back to tests
              </Link>
            )
          }
        />
      </Card>
    );
  }

  // The key starts the picker fresh (with this test's questions chosen) if another test is opened
  return <QuestionPicker key={test.id} test={test} />;
}

function QuestionPicker({ test }: { test: MockTest }) {
  const router = useRouter();
  const toast = useToast();
  const { tests, questions, subjects, modules, topics } = useAdminStore();

  // The chosen question ids, in the order they were chosen
  const [chosen, setChosen] = useState<string[]>(test.questionIds);
  const [query, setQuery] = useState("");
  const [subjectId, setSubjectId] = useState("all");
  const [moduleId, setModuleId] = useState("all");
  const [topicId, setTopicId] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [onlyChosen, setOnlyChosen] = useState(false);
  const [saving, setSaving] = useState(false);

  const subjectById = indexById(subjects.items);
  const moduleById = indexById(modules.items);
  const topicById = indexById(topics.items);
  const chosenSet = new Set(chosen);

  const moduleChoices = modules.items.filter((m) => subjectId === "all" || m.subjectId === subjectId);
  const topicChoices = topics.items.filter((t) => (moduleId === "all" ? subjectId === "all" || t.subjectId === subjectId : t.moduleId === moduleId));

  // Published questions can be added. A question the test already has stays in the list even if it is a draft now.
  const term = query.trim().toLowerCase();
  const pool = questions.items.filter((q) => q.status === "published" || chosenSet.has(q.id));
  const shown = pool.filter((q) => {
    if (onlyChosen && !chosenSet.has(q.id)) return false;
    if (subjectId !== "all" && q.subjectId !== subjectId) return false;
    if (moduleId !== "all" && topicById.get(q.topicId)?.moduleId !== moduleId) return false;
    if (topicId !== "all" && q.topicId !== topicId) return false;
    if (difficulty !== "all" && q.difficulty !== difficulty) return false;
    return !term || q.text.toLowerCase().includes(term) || q.id === term;
  });
  const pagination = usePagination(shown, PAGE_SIZE);

  const allShownChosen = shown.length > 0 && shown.every((q) => chosenSet.has(q.id));
  const changed = chosen.length !== test.questionIds.length || chosen.some((qid, index) => qid !== test.questionIds[index]);

  function toggle(qid: string) {
    setChosen((prev) => (prev.includes(qid) ? prev.filter((x) => x !== qid) : [...prev, qid]));
  }

  function move(index: number, by: -1 | 1) {
    setChosen((prev) => {
      const next = [...prev];
      const target = index + by;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function toggleShown() {
    const shownIds = shown.map((q) => q.id);
    setChosen((prev) => (allShownChosen ? prev.filter((qid) => !shownIds.includes(qid)) : [...prev, ...shownIds.filter((qid) => !prev.includes(qid))]));
  }

  async function save() {
    setSaving(true);
    const result = await updateTest(test.id, { questionIds: chosen });
    setSaving(false);
    if (!result.ok) return toast({ title: "The questions were not saved", description: result.message, tone: "error" });
    tests.update(test.id, result.data);
    toast({ title: "Questions saved", description: `${test.title} now has ${plural(result.data.questionIds.length, "question")}.` });
    router.push("/tests");
  }

  const totalMarks = chosen.length * test.marksPerQuestion;

  return (
    <>
      <Link href="/tests" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to tests
      </Link>
      <PageHeader
        title="Questions of the test"
        description={`Choose the questions students get in “${test.title}”. Only published questions can be added to a published test.`}
        actions={<TestStatusBadge status={test.status} />}
      />

      <Card className="mb-6 overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Questions in this test ({chosen.length}) · {totalMarks} marks
          </h2>
          <p className="text-xs text-slate-500">Students get them in this order. Add more from the list below.</p>
        </div>
        {chosen.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No questions yet. Tick questions in the list below.</p>
        ) : (
          <ol className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {chosen.map((qid, index) => {
              const q = questions.items.find((x) => x.id === qid);
              return (
                <li key={qid} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-7 shrink-0 text-xs font-medium text-slate-500">{index + 1}.</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-900">{q ? q.text : `Question ${qid} (not found)`}</span>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="sm" aria-label={`Move question ${index + 1} up`} disabled={index === 0} onClick={() => move(index, -1)}>
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Move question ${index + 1} down`}
                      disabled={index === chosen.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      ↓
                    </Button>
                    <Button variant="ghost" size="sm" aria-label={`Remove question ${index + 1}`} onClick={() => toggle(qid)}>
                      Remove
                    </Button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Add questions</h2>
        </div>
        <div className="space-y-3 border-b border-slate-200 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <SearchInput value={query} onChange={setQuery} placeholder="Search question text" className="sm:col-span-2 lg:col-span-1" />
            <Select
              aria-label="Filter by subject"
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setModuleId("all");
                setTopicId("all");
              }}
            >
              <option value="all">All subjects</option>
              {subjects.items.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Filter by module"
              value={moduleId}
              onChange={(e) => {
                setModuleId(e.target.value);
                setTopicId("all");
              }}
            >
              <option value="all">All modules</option>
              {moduleChoices.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
            <Select aria-label="Filter by topic" value={topicId} onChange={(e) => setTopicId(e.target.value)}>
              <option value="all">All topics</option>
              {topicChoices.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
            <Select aria-label="Filter by difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="all">All difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-slate-600" aria-live="polite">
              <strong className="text-slate-900">{chosen.length}</strong> chosen · {totalMarks} marks in total
            </p>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={onlyChosen}
                onChange={(e) => setOnlyChosen(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
              />
              Show only the chosen
            </label>
            <div className="flex items-center gap-2 sm:ml-auto">
              <Button variant="outline" size="sm" onClick={toggleShown} disabled={shown.length === 0}>
                {allShownChosen ? `Unchoose all ${shown.length} shown` : `Choose all ${shown.length} shown`}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setChosen([])} disabled={chosen.length === 0}>
                Clear all
              </Button>
            </div>
          </div>
        </div>

        {shown.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-slate-500">
            {pool.length === 0 ? "There are no published questions yet. Add or publish questions in the Question Bank first." : "No questions match these filters."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {pagination.pageItems.map((question) => {
              const topic = topicById.get(question.topicId);
              const where = [subjectById.get(question.subjectId)?.name, topic ? moduleById.get(topic.moduleId)?.name : undefined, topic?.name].filter(Boolean).join(" › ");
              return (
                <li key={question.id}>
                  <label className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={chosenSet.has(question.id)}
                      onChange={() => toggle(question.id)}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-slate-900">{question.text}</span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {question.id} · {where || "—"}
                      </span>
                    </span>
                    {question.status === "draft" ? <QuestionStatusBadge status={question.status} /> : null}
                    <DifficultyBadge status={question.difficulty} />
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        <div className="border-t border-slate-200">
          <Pagination
            page={pagination.page}
            pageCount={pagination.pageCount}
            onPageChange={pagination.setPage}
            from={pagination.from}
            to={pagination.to}
            total={pagination.total}
            noun="questions"
          />
        </div>
      </Card>

      <div className="sticky bottom-0 -mx-4 mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <span className="mr-auto text-sm text-slate-600">{changed ? "You have changes that are not saved yet." : "No changes."}</span>
        <Link href="/tests" className={buttonStyles({ variant: "outline" })}>
          Cancel
        </Link>
        <Button onClick={() => void save()} loading={saving} disabled={!changed}>
          Save questions
        </Button>
      </div>
    </>
  );
}
