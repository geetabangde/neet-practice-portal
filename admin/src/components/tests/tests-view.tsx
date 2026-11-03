"use client";

import { CheckCircle2, ClipboardList, Pencil, Plus, Rocket, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { ListCard } from "@/components/common/list-card";
import { RowActions, type RowAction } from "@/components/common/row-actions";
import { TestStatusBadge } from "@/components/common/status-badges";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { buttonStyles } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Tabs } from "@/components/ui/tabs";
import { usePagination } from "@/hooks/use-pagination";
import { formatDateTime, plural } from "@/lib/format";
import { testTotals } from "@/lib/selectors";
import type { MockTest, TestStatus } from "@/types";

type StatusFilter = "all" | TestStatus;

const PAGE_SIZE = 8;

export function TestsView() {
  const { tests, subjects } = useAdminStore();
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [deleting, setDeleting] = useState<MockTest | null>(null);

  const term = query.trim().toLowerCase();
  const filtered = tests.items.filter((test) => {
    if (status !== "all" && test.status !== status) return false;
    return !term || test.title.toLowerCase().includes(term) || test.description.toLowerCase().includes(term);
  });
  const pagination = usePagination(filtered, PAGE_SIZE);

  const countOf = (value: TestStatus) => tests.items.filter((t) => t.status === value).length;

  function changeStatus(test: MockTest, next: TestStatus) {
    tests.update(test.id, { status: next });
    toast({
      title: next === "published" ? "Test published" : "Test marked as completed",
      description: test.title,
    });
  }

  const columns: Column<MockTest>[] = [
    {
      key: "title",
      header: "Test",
      primary: true,
      className: "max-w-sm",
      cell: (test) => (
        <div className="min-w-0">
          <Link href={`/tests/${test.id}/edit`} className="block truncate font-medium text-slate-900 hover:text-indigo-700">
            {test.title}
          </Link>
          <p className="truncate text-xs text-slate-500">
            {test.subjectIds
              .map((id) => subjects.items.find((s) => s.id === id)?.name)
              .filter(Boolean)
              .slice(0, 3)
              .join(", ") || "No subjects"}
            {test.subjectIds.length > 3 ? ` +${test.subjectIds.length - 3}` : ""}
          </p>
        </div>
      ),
    },
    { key: "questions", header: "Questions", align: "right", cell: (test) => testTotals(test).totalQuestions },
    { key: "marks", header: "Marks", align: "right", cell: (test) => testTotals(test).totalMarks },
    { key: "duration", header: "Duration", cell: (test) => `${test.durationMinutes} min` },
    { key: "negative", header: "Negative", hideOnMobile: true, hideBelow: "xl", cell: (test) => (test.negativeMarking > 0 ? `−${test.negativeMarking}` : "None") },
    { key: "start", header: "Starts", hideBelow: "lg", cell: (test) => <span className="whitespace-nowrap">{formatDateTime(test.startAt)}</span> },
    { key: "status", header: "Status", cell: (test) => <TestStatusBadge status={test.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Test management"
        description="Create mock tests, choose their questions, and decide when students can take them."
        actions={
          <Link href="/tests/new" className={buttonStyles()}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create test
          </Link>
        }
      />

      <ListCard
        toolbar={
          <>
            <SearchInput value={query} onChange={setQuery} placeholder="Search tests" className="w-full sm:w-72" />
            <Tabs
              ariaLabel="Filter by status"
              value={status}
              onChange={setStatus}
              tabs={[
                { value: "all", label: "All", count: tests.items.length },
                { value: "draft", label: "Draft", count: countOf("draft") },
                { value: "published", label: "Published", count: countOf("published") },
                { value: "completed", label: "Completed", count: countOf("completed") },
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
            noun="tests"
          />
        }
      >
        <DataTable
          caption="Tests"
          columns={columns}
          rows={pagination.pageItems}
          getRowId={(test) => test.id}
          empty={
            <EmptyState
              icon={ClipboardList}
              title="No tests found"
              description="Create your first test, or change the filters."
              action={
                <Link href="/tests/new" className={buttonStyles()}>
                  Create test
                </Link>
              }
            />
          }
          actions={(test) => {
            const actions: RowAction[] = [{ label: `Edit ${test.title}`, icon: Pencil, href: `/tests/${test.id}/edit` }];
            if (test.status === "draft") {
              actions.unshift({ label: `Publish ${test.title}`, icon: Rocket, onClick: () => changeStatus(test, "published") });
            }
            if (test.status === "published") {
              actions.unshift({ label: `Mark ${test.title} as completed`, icon: CheckCircle2, onClick: () => changeStatus(test, "completed") });
            }
            actions.push({ label: `Delete ${test.title}`, icon: Trash2, onClick: () => setDeleting(test), danger: true });
            return <RowActions actions={actions} />;
          }}
        />
      </ListCard>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          tests.remove(deleting.id);
          toast({ title: "Test deleted", description: deleting.title });
        }}
        title="Delete this test?"
        description={
          deleting ? (
            <>
              <strong className="text-slate-900">{deleting.title}</strong> with {plural(deleting.questionIds.length, "question")} will
              be deleted. Questions stay in the question bank. This cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete test"
      />
    </>
  );
}
