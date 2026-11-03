"use client";

import { ClipboardCheck, Eye, Percent, Target, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { ListCard } from "@/components/common/list-card";
import { RowActions } from "@/components/common/row-actions";
import { StatCard } from "@/components/common/stat-card";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/form-controls";
import { Pagination } from "@/components/ui/pagination";
import { ProgressBar } from "@/components/ui/progress";
import { SearchInput } from "@/components/ui/search-input";
import { usePagination } from "@/hooks/use-pagination";
import { formatDate } from "@/lib/format";
import { indexById, resultAccuracy, scoreTone } from "@/lib/selectors";
import type { TestResult } from "@/types";

const PAGE_SIZE = 10;

type SortKey = "newest" | "best" | "lowest";

export function ResultsView() {
  const { results, students, tests } = useAdminStore();
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [testFilter, setTestFilter] = useState("all");
  const [band, setBand] = useState("all");
  const [sort, setSort] = useState<SortKey>("newest");

  const studentById = indexById(students.items);
  const testById = indexById(tests.items);
  const term = query.trim().toLowerCase();

  const filtered = results
    .filter((result) => {
      const accuracy = resultAccuracy(result);
      if (testFilter !== "all" && result.testId !== testFilter) return false;
      if (band === "high" && accuracy < 75) return false;
      if (band === "mid" && (accuracy < 50 || accuracy >= 75)) return false;
      if (band === "low" && accuracy >= 50) return false;
      if (!term) return true;
      const student = studentById.get(result.studentId)?.name ?? "";
      const test = testById.get(result.testId)?.title ?? "";
      return student.toLowerCase().includes(term) || test.toLowerCase().includes(term);
    })
    .sort((a, b) => {
      if (sort === "best") return resultAccuracy(b) - resultAccuracy(a);
      if (sort === "lowest") return resultAccuracy(a) - resultAccuracy(b);
      return b.completedAt.localeCompare(a.completedAt) || b.id.localeCompare(a.id);
    });
  const pagination = usePagination(filtered, PAGE_SIZE);

  const average = filtered.length
    ? Math.round(filtered.reduce((sum, r) => sum + resultAccuracy(r), 0) / filtered.length)
    : 0;
  const best = filtered.reduce((max, r) => Math.max(max, resultAccuracy(r)), 0);
  const passing = filtered.filter((r) => resultAccuracy(r) >= 50).length;

  const columns: Column<TestResult>[] = [
    {
      key: "student",
      header: "Student and test",
      primary: true,
      cell: (result) => {
        const student = studentById.get(result.studentId);
        return (
          <div className="flex items-center gap-3">
            <Avatar name={student?.name ?? "?"} size="sm" />
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900">{student?.name ?? "Deleted student"}</p>
              <p className="truncate text-xs text-slate-500">{testById.get(result.testId)?.title ?? "Deleted test"}</p>
            </div>
          </div>
        );
      },
    },
    { key: "total", header: "Total marks", align: "right", cell: (result) => result.totalMarks },
    { key: "obtained", header: "Obtained", align: "right", cell: (result) => <span className="font-semibold text-slate-900">{result.marksObtained}</span> },
    {
      key: "accuracy",
      header: "Accuracy",
      cell: (result) => {
        const accuracy = resultAccuracy(result);
        return (
          <div className="flex min-w-24 items-center gap-2">
            <ProgressBar value={accuracy} tone={scoreTone(accuracy)} label={`Accuracy ${accuracy}%`} className="w-16" />
            <span className="w-9 text-sm font-medium text-slate-700">{accuracy}%</span>
          </div>
        );
      },
    },
    { key: "correct", header: "Correct", align: "right", cell: (result) => <span className="text-emerald-600">{result.correct}</span> },
    { key: "incorrect", header: "Incorrect", align: "right", hideBelow: "lg", cell: (result) => <span className="text-red-600">{result.incorrect}</span> },
    { key: "unattempted", header: "Unattempted", align: "right", hideBelow: "xl", cell: (result) => <span className="text-slate-500">{result.unattempted}</span> },
    { key: "date", header: "Completed", cell: (result) => <span className="whitespace-nowrap">{formatDate(result.completedAt)}</span> },
  ];

  const clearFilters = () => {
    setQuery("");
    setTestFilter("all");
    setBand("all");
  };

  return (
    <>
      <PageHeader
        title="Test results"
        description="How students performed in every test they attempted."
        actions={
          <Button variant="outline" onClick={() => toast({ title: "Export started", description: "Demo only: no file is created yet." })}>
            Export results
          </Button>
        }
      />

      <section aria-label="Summary of the shown results" className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Attempts" value={String(filtered.length)} icon={ClipboardCheck} tone="indigo" />
        <StatCard label="Average accuracy" value={`${average}%`} icon={Percent} tone="blue" />
        <StatCard label="Best accuracy" value={`${best}%`} icon={Trophy} tone="amber" />
        <StatCard label="Scored 50% or more" value={filtered.length ? `${Math.round((passing / filtered.length) * 100)}%` : "0%"} icon={Target} tone="emerald" />
      </section>

      <ListCard
        toolbar={
          <div className="grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-[1.4fr_1.4fr_1fr_1fr]">
            <SearchInput value={query} onChange={setQuery} placeholder="Search student or test" />
            <Select aria-label="Filter by test" value={testFilter} onChange={(e) => setTestFilter(e.target.value)}>
              <option value="all">All tests</option>
              {tests.items
                .filter((test) => test.status !== "draft")
                .map((test) => (
                  <option key={test.id} value={test.id}>
                    {test.title}
                  </option>
                ))}
            </Select>
            <Select aria-label="Filter by accuracy" value={band} onChange={(e) => setBand(e.target.value)}>
              <option value="all">Any accuracy</option>
              <option value="high">75% and above</option>
              <option value="mid">50% to 74%</option>
              <option value="low">Below 50%</option>
            </Select>
            <Select aria-label="Sort results" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="newest">Newest first</option>
              <option value="best">Highest accuracy</option>
              <option value="lowest">Lowest accuracy</option>
            </Select>
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
            noun="results"
          />
        }
      >
        <DataTable
          caption="Test results"
          columns={columns}
          rows={pagination.pageItems}
          getRowId={(result) => result.id}
          empty={
            <EmptyState
              icon={ClipboardCheck}
              title="No results found"
              description="No attempt matches these filters."
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          }
          actions={(result) => (
            <RowActions actions={[{ label: `View result ${result.id}`, icon: Eye, href: `/results/${result.id}` }]} />
          )}
        />
      </ListCard>
      <p className="mt-3 text-xs text-slate-400">
        Accuracy is the share of attempted questions answered correctly.{" "}
        <Link href="/analytics" className="text-indigo-600 hover:underline">
          See analytics
        </Link>
      </p>
    </>
  );
}
