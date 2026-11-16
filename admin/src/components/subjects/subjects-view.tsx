"use client";

import { BookOpen, Eye, FileQuestion, Layers, LayoutList, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { updateSubject } from "@/lib/subjects-api";
import { PageHeader } from "@/components/common/page-header";
import { SubjectIcon } from "@/components/common/subject-icon";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { ActiveBadge } from "@/components/common/status-badges";
import { Button, IconButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Switch } from "@/components/ui/form-controls";
import { SearchInput } from "@/components/ui/search-input";
import { Tabs } from "@/components/ui/tabs";
import { subjectStats } from "@/lib/selectors";
import type { Subject } from "@/types";
import { SubjectFormModal, type SubjectModalState } from "./subject-form-modal";

type StatusFilter = "all" | "active" | "inactive";

export function SubjectsView() {
  const { subjects, modules, contentStatus, reloadContent, topics, questions } = useAdminStore();
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [modal, setModal] = useState<SubjectModalState>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleStatus(subject: Subject, active: boolean) {
    setBusyId(subject.id);
    const result = await updateSubject(subject.id, { status: active ? "active" : "inactive" });
    setBusyId(null);
    if (!result.ok) return toast({ title: "Could not update the subject", description: result.message, tone: "error" });
    subjects.update(subject.id, { status: result.data.status });
    toast({ title: active ? "Subject activated" : "Subject deactivated", description: subject.name });
  }

  const term = query.trim().toLowerCase();
  const visible = subjects.items.filter((subject) => {
    if (status !== "all" && subject.status !== status) return false;
    return !term || subject.name.toLowerCase().includes(term) || subject.description.toLowerCase().includes(term);
  });

  return (
    <>
      <PageHeader
        title="Subjects"
        description="Manage the subjects students can practise. Use the eye button to open a subject and manage its modules and topics."
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

      {contentStatus === "loading" ? (
        <p role="status" className="py-16 text-center text-sm text-slate-500">
          Loading subjects…
        </p>
      ) : contentStatus === "error" ? (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="Could not load subjects"
            description="The server did not respond. Check that the backend is running."
            action={<Button onClick={reloadContent}>Try again</Button>}
          />
        </Card>
      ) : visible.length === 0 ? (
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
            const stats = subjectStats(subject.id, modules.items, topics.items, questions.items);
            return (
              <li key={subject.id}>
                <Card className="flex h-full flex-col p-5 transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <SubjectIcon icon={subject.icon} size="lg" />
                    <ActiveBadge status={subject.status} />
                  </div>
                  <h2 className="mt-4 text-base font-semibold text-slate-900">{subject.name}</h2>
                  <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">{subject.description || "No description."}</p>

                  <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                        <LayoutList className="h-3.5 w-3.5" aria-hidden="true" /> Modules
                      </dt>
                      <dd className="mt-0.5 text-lg font-semibold text-slate-900">{stats.totalModules}</dd>
                    </div>
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
                        disabled={busyId === subject.id}
                        onChange={(checked) => void toggleStatus(subject, checked)}
                      />
                      Active
                    </label>
                    <div className="flex items-center gap-0.5">
                      <Link
                        href={`/subjects/${subject.id}`}
                        aria-label={`View modules and topics of ${subject.name}`}
                        title="View modules and topics"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </Link>
                      <IconButton label={`Edit ${subject.name}`} onClick={() => setModal(subject)}>
                        <Pencil className="h-4 w-4" />
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
    </>
  );
}
