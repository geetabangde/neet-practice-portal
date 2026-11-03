"use client";

import { BookOpen, FileQuestion, Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { SubjectIcon } from "@/components/common/subject-icon";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { ActiveBadge } from "@/components/common/status-badges";
import { Button, IconButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Switch } from "@/components/ui/form-controls";
import { SearchInput } from "@/components/ui/search-input";
import { Tabs } from "@/components/ui/tabs";
import { plural } from "@/lib/format";
import { subjectStats } from "@/lib/selectors";
import type { Subject } from "@/types";
import { SubjectFormModal, type SubjectModalState } from "./subject-form-modal";

type StatusFilter = "all" | "active" | "inactive";

export function SubjectsView() {
  const { subjects, topics, questions, removeSubject } = useAdminStore();
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [modal, setModal] = useState<SubjectModalState>(null);
  const [deleting, setDeleting] = useState<Subject | null>(null);

  const term = query.trim().toLowerCase();
  const visible = subjects.items.filter((subject) => {
    if (status !== "all" && subject.status !== status) return false;
    return !term || subject.name.toLowerCase().includes(term) || subject.description.toLowerCase().includes(term);
  });

  const deletingStats = deleting ? subjectStats(deleting.id, topics.items, questions.items) : null;

  return (
    <>
      <PageHeader
        title="Subjects"
        description="Manage the subjects students can practise. Each subject holds topics and questions."
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setModal("new")}>
            Add subject
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search subjects" className="w-full sm:w-72" />
        <Tabs
          ariaLabel="Filter by status"
          value={status}
          onChange={setStatus}
          tabs={[
            { value: "all", label: "All", count: subjects.items.length },
            { value: "active", label: "Active", count: subjects.items.filter((s) => s.status === "active").length },
            { value: "inactive", label: "Inactive", count: subjects.items.filter((s) => s.status === "inactive").length },
          ]}
        />
      </div>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="No subjects found"
            description="Try a different search, or add a new subject."
            action={<Button onClick={() => setModal("new")}>Add subject</Button>}
          />
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visible.map((subject) => {
            const stats = subjectStats(subject.id, topics.items, questions.items);
            return (
              <li key={subject.id}>
                <Card className="flex h-full flex-col p-5 transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <SubjectIcon icon={subject.icon} size="lg" />
                    <ActiveBadge status={subject.status} />
                  </div>
                  <h2 className="mt-4 text-base font-semibold text-slate-900">{subject.name}</h2>
                  <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">{subject.description || "No description."}</p>

                  <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Layers className="h-3.5 w-3.5" aria-hidden="true" /> Topics
                      </dt>
                      <dd className="mt-0.5 text-lg font-semibold text-slate-900">{stats.totalTopics}</dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                        <FileQuestion className="h-3.5 w-3.5" aria-hidden="true" /> Questions
                      </dt>
                      <dd className="mt-0.5 text-lg font-semibold text-slate-900">{stats.totalQuestions}</dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                      <Switch
                        label={`${subject.name} is active`}
                        checked={subject.status === "active"}
                        onChange={(checked) => {
                          subjects.update(subject.id, { status: checked ? "active" : "inactive" });
                          toast({ title: checked ? "Subject activated" : "Subject deactivated", description: subject.name });
                        }}
                      />
                      Active
                    </label>
                    <div className="flex items-center gap-0.5">
                      <IconButton label={`Edit ${subject.name}`} onClick={() => setModal(subject)}>
                        <Pencil className="h-4 w-4" />
                      </IconButton>
                      <IconButton label={`Delete ${subject.name}`} onClick={() => setDeleting(subject)} className="hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <SubjectFormModal state={modal} onClose={() => setModal(null)} />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          removeSubject(deleting.id);
          toast({ title: "Subject deleted", description: `${deleting.name} and its content were removed.` });
        }}
        title="Delete this subject?"
        description={
          deleting && deletingStats ? (
            <>
              <strong className="text-slate-900">{deleting.name}</strong> will be deleted together with{" "}
              <strong>{plural(deletingStats.totalTopics, "topic")}</strong> and{" "}
              <strong>{plural(deletingStats.totalQuestions, "question")}</strong>. This cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete subject"
      />
    </>
  );
}
