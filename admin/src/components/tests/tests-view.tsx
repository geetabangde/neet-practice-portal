"use client";

import { CheckCircle2, ClipboardList, ListChecks, Pencil, Plus, Rocket, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { deleteTest, updateTest } from "@/lib/tests-api";
import { PageHeader } from "@/components/common/page-header";
import { ListCard } from "@/components/common/list-card";
import { RowActions, type RowAction } from "@/components/common/row-actions";
import { TestStatusBadge } from "@/components/common/status-badges";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button, buttonStyles } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Tabs } from "@/components/ui/tabs";
import { usePagination } from "@/hooks/use-pagination";
import { formatDateTime, plural } from "@/lib/format";
import { testTotals } from "@/lib/selectors";
import type { MockTest, TestKind, TestStatus } from "@/types";

type StatusFilter = "all" | TestStatus;
type KindFilter = TestKind;

const KIND_LABELS: Record<TestKind, string> = { grand: "Grand Tests", mini: "Mini Tests", subject: "Subject Tests" };

const PAGE_SIZE = 8;

export function TestsView() {
  const { tests, contentStatus, reloadContent } = useAdminStore();
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [kind, setKind] = useState<KindFilter>("grand");
  const [deleting, setDeleting] = useState<MockTest | null>(null);

  const term = query.trim().toLowerCase();
  const filtered = tests.items.filter((test) => {
    if (test.kind !== kind) return false;
    if (status !== "all" && test.status !== status) return false;
    return !term || test.title.toLowerCase().includes(term) || test.description.toLowerCase().includes(term);
  });
  const pagination = usePagination(filtered, PAGE_SIZE);

  const ofKind = tests.items.filter((t) => t.kind === kind);
  const countOf = (value: TestStatus) => ofKind.filter((t) => t.status === value).length;
  const kindCount = (value: TestKind) => tests.items.filter((t) => t.kind === value).length;

  async function changeStatus(test: MockTest, next: TestStatus) {
    const result = await updateTest(test.id, { status: next });
    if (!result.ok) return toast({ title: "Could not change the status", description: result.message, tone: "error" });
    tests.update(test.id, result.data);
    toast({
      title: next === "published" ? "Test published" : "Test marked as completed",
      description: test.title,
    });
  }

  async function confirmDelete(test: MockTest) {
    const result = await deleteTest(test.id);
    // 404 = already gone, so the list should drop it too
    if (!result.ok && result.status !== 404) {
      return toast({ title: "Could not delete the test", description: result.message, tone: "error" });
    }
    tests.remove(test.id);
    toast({ title: "Test deleted", description: test.title });
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
          <p className="truncate text-xs text-slate-500">{test.description || (test.questionCount === 0 ? "No questions yet" : plural(test.questionCount, "question"))}</p>
        </div>
      ),
    },
    {
      key: "questions",
      header: "Questions",
      align: "right",
      cell: (test) => {
        const total = testTotals(test).totalQuestions;
        return (
          <Link
            href={`/tests/${test.id}/questions`}
            className={buttonStyles({ variant: "outline", size: "sm" })}
            aria-label={`${total === 0 ? "Add questions to" : "Manage questions of"} ${test.title}`}
          >
            <ListChecks className="h-4 w-4" aria-hidden="true" />
            {plural(total, "Question")}
          </Link>
        );
      },
    },
    { key: "pattern", header: "Pattern", hideBelow: "lg", cell: (test) => test.pattern },
    { key: "marks", header: "Marks", align: "right", cell: (test) => testTotals(test).totalMarks },
    { key: "duration", header: "Duration", cell: (test) => `${test.durationMinutes} min` },
    { key: "negative", header: "Negative", hideOnMobile: true, hideBelow: "xl", cell: (test) => `${test.negativeRatio} (−${test.negativeMarking})` },
    { key: "start", header: "Starts", hideBelow: "lg", cell: (test) => <span className="whitespace-nowrap">{formatDateTime(test.startAt)}</span> },
    { key: "status", header: "Status", cell: (test) => <TestStatusBadge status={test.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Test management"
        description="Create a test, then use its Questions button to write its questions. Publish it when it is ready."
        actions={
          <Link href="/tests/new" className={buttonStyles()}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create test
          </Link>
        }
      />

      {contentStatus === "error" ? (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load tests from the server.
          <Button size="sm" variant="outline" onClick={reloadContent}>
            Try again
          </Button>
        </div>
      ) : null}

      <ListCard
        toolbar={
          <>
            <SearchInput value={query} onChange={setQuery} placeholder="Search tests" className="w-full sm:w-72" />
            <Tabs
              ariaLabel="Test type"
              value={kind}
              onChange={setKind}
              tabs={(["grand", "mini", "subject"] as const).map((value) => ({ value, label: KIND_LABELS[value], count: kindCount(value) }))}
            />
            <Tabs
              ariaLabel="Filter by status"
              value={status}
              onChange={setStatus}
              tabs={[
                { value: "all", label: "All", count: ofKind.length },
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
            const actions: RowAction[] = [
              { label: `Questions of ${test.title}`, icon: ListChecks, href: `/tests/${test.id}/questions` },
              { label: `Edit ${test.title}`, icon: Pencil, href: `/tests/${test.id}/edit` },
            ];
            if (test.status === "draft") {
              actions.unshift({ label: `Publish ${test.title}`, icon: Rocket, onClick: () => void changeStatus(test, "published") });
            }
            if (test.status === "published") {
              actions.unshift({ label: `Mark ${test.title} as completed`, icon: CheckCircle2, onClick: () => void changeStatus(test, "completed") });
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
          if (deleting) void confirmDelete(deleting);
        }}
        title="Delete this test?"
        description={
          deleting ? (
            <>
              <strong className="text-slate-900">{deleting.title}</strong> with {plural(deleting.questionCount, "question")} will
              be deleted, and the students&apos; attempts of it too. This cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete test"
      />
    </>
  );
}
