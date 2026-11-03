"use client";

import { Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { ListCard } from "@/components/common/list-card";
import { RowActions } from "@/components/common/row-actions";
import { SubjectIcon } from "@/components/common/subject-icon";
import { ActiveBadge } from "@/components/common/status-badges";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/form-controls";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Tabs } from "@/components/ui/tabs";
import { usePagination } from "@/hooks/use-pagination";
import { plural } from "@/lib/format";
import { indexById, topicQuestionCount } from "@/lib/selectors";
import type { Topic } from "@/types";
import { TopicFormModal, type TopicModalState } from "./topic-form-modal";

type StatusFilter = "all" | "active" | "inactive";

const PAGE_SIZE = 10;

export function TopicsView() {
  const { topics, subjects, questions, removeTopic } = useAdminStore();
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [modal, setModal] = useState<TopicModalState>(null);
  const [deleting, setDeleting] = useState<Topic | null>(null);

  const subjectById = indexById(subjects.items);
  const term = query.trim().toLowerCase();

  const filtered = topics.items.filter((topic) => {
    if (subjectFilter !== "all" && topic.subjectId !== subjectFilter) return false;
    if (status !== "all" && topic.status !== status) return false;
    return !term || topic.name.toLowerCase().includes(term);
  });
  const pagination = usePagination(filtered, PAGE_SIZE);

  const columns: Column<Topic>[] = [
    { key: "name", header: "Topic", primary: true, cell: (topic) => <span className="font-medium text-slate-900">{topic.name}</span> },
    {
      key: "subject",
      header: "Subject",
      cell: (topic) => {
        const subject = subjectById.get(topic.subjectId);
        return subject ? (
          <span className="flex items-center gap-2.5">
            <SubjectIcon icon={subject.icon} size="sm" className="h-7 w-7 rounded-lg" />
            {subject.name}
          </span>
        ) : (
          <span className="text-slate-400">Deleted subject</span>
        );
      },
    },
    { key: "questions", header: "Questions", align: "right", cell: (topic) => topicQuestionCount(topic.id, questions.items) },
    { key: "status", header: "Status", cell: (topic) => <ActiveBadge status={topic.status} /> },
  ];

  const clearFilters = () => {
    setQuery("");
    setSubjectFilter("all");
    setStatus("all");
  };

  return (
    <>
      <PageHeader
        title="Topics"
        description="Topics split a subject into smaller parts. Every question belongs to one topic."
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setModal("new")} disabled={subjects.items.length === 0}>
            Add topic
          </Button>
        }
      />

      <ListCard
        toolbar={
          <>
            <SearchInput value={query} onChange={setQuery} placeholder="Search topics" className="w-full sm:w-64" />
            <div className="w-full sm:w-56">
              <Select aria-label="Filter by subject" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
                <option value="all">All subjects</option>
                {subjects.items.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </Select>
            </div>
            <Tabs
              ariaLabel="Filter by status"
              value={status}
              onChange={setStatus}
              className="sm:ml-auto"
              tabs={[
                { value: "all", label: "All" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </>
        }
        footer={
          <Pagination
            page={pagination.page}
            pageCount={pagination.pageCount}
            onPageChange={pagination.setPage}
            from={pagination.from}
            to={pagination.to}
            total={pagination.total}
            noun="topics"
          />
        }
      >
        <DataTable
          caption="Topics"
          columns={columns}
          rows={pagination.pageItems}
          getRowId={(topic) => topic.id}
          empty={
            <EmptyState
              icon={Layers}
              title="No topics found"
              description="Try a different search, or add a topic."
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          }
          actions={(topic) => (
            <RowActions
              actions={[
                { label: `Edit ${topic.name}`, icon: Pencil, onClick: () => setModal(topic) },
                { label: `Delete ${topic.name}`, icon: Trash2, onClick: () => setDeleting(topic), danger: true },
              ]}
            />
          )}
        />
      </ListCard>

      <TopicFormModal
        state={modal}
        defaultSubjectId={subjectFilter === "all" ? "" : subjectFilter}
        onClose={() => setModal(null)}
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          removeTopic(deleting.id);
          toast({ title: "Topic deleted", description: `${deleting.name} and its questions were removed.` });
        }}
        title="Delete this topic?"
        description={
          deleting ? (
            <>
              <strong className="text-slate-900">{deleting.name}</strong> will be deleted together with{" "}
              <strong>{plural(topicQuestionCount(deleting.id, questions.items), "question")}</strong>. This cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete topic"
      />
    </>
  );
}
