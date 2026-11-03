"use client";

import { FileQuestion, ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { ListCard } from "@/components/common/list-card";
import { RowActions } from "@/components/common/row-actions";
import { DifficultyBadge, QuestionStatusBadge } from "@/components/common/status-badges";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/form-controls";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Tabs } from "@/components/ui/tabs";
import { usePagination } from "@/hooks/use-pagination";
import { indexById } from "@/lib/selectors";
import type { Question } from "@/types";

type StatusFilter = "all" | "published" | "draft";

const PAGE_SIZE = 10;

const typeLabels = { single: "Single correct", multiple: "Multiple correct" } as const;

export function QuestionsView({ initialQuery = "" }: { initialQuery?: string }) {
  const { questions, subjects, topics, removeQuestion } = useAdminStore();
  const toast = useToast();

  const [query, setQuery] = useState(initialQuery);
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [deleting, setDeleting] = useState<Question | null>(null);

  const subjectById = indexById(subjects.items);
  const topicById = indexById(topics.items);
  const topicChoices = topics.items.filter((topic) => subjectFilter === "all" || topic.subjectId === subjectFilter);
  const term = query.trim().toLowerCase();

  const filtered = questions.items.filter((question) => {
    if (subjectFilter !== "all" && question.subjectId !== subjectFilter) return false;
    if (topicFilter !== "all" && question.topicId !== topicFilter) return false;
    if (difficulty !== "all" && question.difficulty !== difficulty) return false;
    if (type !== "all" && question.type !== type) return false;
    if (status !== "all" && question.status !== status) return false;
    return !term || question.text.toLowerCase().includes(term) || question.id.toLowerCase().includes(term);
  });
  const pagination = usePagination(filtered, PAGE_SIZE);

  const columns: Column<Question>[] = [
    {
      key: "question",
      header: "Question",
      primary: true,
      className: "max-w-md",
      cell: (question) => (
        <div className="min-w-0">
          <p className="line-clamp-2 font-medium text-slate-900">{question.text}</p>
          <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
            {question.id}
            {question.imageName ? (
              <span className="inline-flex items-center gap-1">
                <ImageIcon className="h-3 w-3" aria-hidden="true" /> Image
              </span>
            ) : null}
          </p>
        </div>
      ),
    },
    { key: "subject", header: "Subject", cell: (q) => subjectById.get(q.subjectId)?.name ?? "—" },
    { key: "topic", header: "Topic", hideBelow: "lg", cell: (q) => topicById.get(q.topicId)?.name ?? "—" },
    { key: "type", header: "Type", hideBelow: "xl", cell: (q) => <Badge tone="slate">{typeLabels[q.type]}</Badge> },
    { key: "difficulty", header: "Difficulty", cell: (q) => <DifficultyBadge status={q.difficulty} /> },
    { key: "status", header: "Status", cell: (q) => <QuestionStatusBadge status={q.status} /> },
  ];

  const clearFilters = () => {
    setQuery("");
    setSubjectFilter("all");
    setTopicFilter("all");
    setDifficulty("all");
    setType("all");
    setStatus("all");
  };

  return (
    <>
      <PageHeader
        title="Question bank"
        description="Every MCQ students can practise. Filter by subject, topic, difficulty or type."
        actions={
          <Link href="/questions/new" className={buttonStyles()}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add question
          </Link>
        }
      />

      <ListCard
        toolbar={
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.4fr_repeat(4,1fr)]">
            <SearchInput value={query} onChange={setQuery} placeholder="Search question text or ID" className="sm:col-span-2 lg:col-span-3 xl:col-span-1" />
            <Select
              aria-label="Filter by subject"
              value={subjectFilter}
              onChange={(e) => {
                setSubjectFilter(e.target.value);
                setTopicFilter("all");
              }}
            >
              <option value="all">All subjects</option>
              {subjects.items.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </Select>
            <Select aria-label="Filter by topic" value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)}>
              <option value="all">All topics</option>
              {topicChoices.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </Select>
            <Select aria-label="Filter by difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="all">All difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>
            <Select aria-label="Filter by question type" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">All types</option>
              <option value="single">Single correct</option>
              <option value="multiple">Multiple correct</option>
            </Select>
            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-5">
              <Tabs
                ariaLabel="Filter by status"
                value={status}
                onChange={setStatus}
                tabs={[
                  { value: "all", label: "All", count: questions.items.length },
                  { value: "published", label: "Published", count: questions.items.filter((q) => q.status === "published").length },
                  { value: "draft", label: "Drafts", count: questions.items.filter((q) => q.status === "draft").length },
                ]}
              />
            </div>
          </div>
        }
        footer={
          <Pagination
            page={pagination.page}
            pageCount={pagination.pageCount}
            onPageChange={pagination.setPage}
            from={pagination.from}
            to={pagination.to}
            total={pagination.total}
            noun="questions"
          />
        }
      >
        <DataTable
          caption="Questions"
          columns={columns}
          rows={pagination.pageItems}
          getRowId={(question) => question.id}
          empty={
            <EmptyState
              icon={FileQuestion}
              title="No questions found"
              description="Nothing matches these filters. Clear them, or add a new question."
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          }
          actions={(question) => (
            <RowActions
              actions={[
                { label: `Edit ${question.id}`, icon: Pencil, href: `/questions/${question.id}/edit` },
                { label: `Delete ${question.id}`, icon: Trash2, onClick: () => setDeleting(question), danger: true },
              ]}
            />
          )}
        />
      </ListCard>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          removeQuestion(deleting.id);
          toast({ title: "Question deleted", description: `${deleting.id} was removed from the bank.` });
        }}
        title="Delete this question?"
        description={
          deleting ? (
            <>
              <strong className="text-slate-900">{deleting.id}</strong> will be removed from the question bank and from every
              test that uses it. This cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete question"
      />
    </>
  );
}
