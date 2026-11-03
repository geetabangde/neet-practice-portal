"use client";

import { Eye, Pencil, UserCheck, UserX, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ActiveBadge } from "@/components/common/status-badges";
import { ListCard } from "@/components/common/list-card";
import { RowActions } from "@/components/common/row-actions";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/form-controls";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Tabs } from "@/components/ui/tabs";
import { usePagination } from "@/hooks/use-pagination";
import { formatDate } from "@/lib/format";
import type { Student } from "@/types";
import { StudentFormModal } from "./student-form-modal";

type StatusFilter = "all" | "active" | "inactive";

const PAGE_SIZE = 8;

export function StudentsView() {
  const { students, plans } = useAdminStore();
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [editing, setEditing] = useState<Student | null>(null);
  const [toggling, setToggling] = useState<Student | null>(null);

  const planName = new Map(plans.items.map((plan) => [plan.id, plan.name]));
  const term = query.trim().toLowerCase();

  const filtered = students.items.filter((student) => {
    if (status !== "all" && student.status !== status) return false;
    if (planFilter === "none" && student.planId !== null) return false;
    if (planFilter !== "all" && planFilter !== "none" && student.planId !== planFilter) return false;
    if (!term) return true;
    return [student.name, student.email, student.phone].some((text) => text.toLowerCase().includes(term));
  });

  const pagination = usePagination(filtered, PAGE_SIZE);

  const columns: Column<Student>[] = [
    {
      key: "student",
      header: "Student",
      primary: true,
      cell: (student) => (
        <div className="flex items-center gap-3">
          <Avatar name={student.name} />
          <div className="min-w-0">
            <Link href={`/students/${student.id}`} className="block truncate font-medium text-slate-900 hover:text-indigo-700">
              {student.name}
            </Link>
            <p className="truncate text-xs text-slate-500">{student.email}</p>
          </div>
        </div>
      ),
    },
    { key: "phone", header: "Mobile", hideBelow: "lg", cell: (student) => <span className="whitespace-nowrap">{student.phone}</span> },
    { key: "registered", header: "Registered", cell: (student) => formatDate(student.registeredAt) },
    {
      key: "plan",
      header: "Plan",
      cell: (student) =>
        student.planId ? <Badge tone="indigo">{planName.get(student.planId) ?? "Plan"}</Badge> : <Badge>No plan</Badge>,
    },
    { key: "status", header: "Status", cell: (student) => <ActiveBadge status={student.status} /> },
  ];

  const clearFilters = () => {
    setQuery("");
    setStatus("all");
    setPlanFilter("all");
  };

  function toggleStatus(student: Student) {
    const next = student.status === "active" ? "inactive" : "active";
    students.update(student.id, { status: next });
    toast({
      title: next === "active" ? "Student activated" : "Student deactivated",
      description: `${student.name} is now ${next}.`,
    });
  }

  return (
    <>
      <ListCard
        toolbar={
          <>
            <SearchInput value={query} onChange={setQuery} placeholder="Search name, email or mobile" className="w-full sm:w-80" />
            <Tabs
              ariaLabel="Filter by account status"
              value={status}
              onChange={setStatus}
              tabs={[
                { value: "all", label: "All", count: students.items.length },
                { value: "active", label: "Active", count: students.items.filter((s) => s.status === "active").length },
                { value: "inactive", label: "Inactive", count: students.items.filter((s) => s.status === "inactive").length },
              ]}
            />
            <div className="w-full sm:ml-auto sm:w-48">
              <Select aria-label="Filter by subscription plan" value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
                <option value="all">All plans</option>
                <option value="none">No plan</option>
                {plans.items.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </Select>
            </div>
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
            noun="students"
          />
        }
      >
        <DataTable
          caption="Students"
          columns={columns}
          rows={pagination.pageItems}
          getRowId={(student) => student.id}
          empty={
            <EmptyState
              icon={Users}
              title="No students found"
              description="Try a different search or clear the filters."
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          }
          actions={(student) => (
            <RowActions
              actions={[
                { label: `View ${student.name}`, icon: Eye, href: `/students/${student.id}` },
                { label: `Edit ${student.name}`, icon: Pencil, onClick: () => setEditing(student) },
                student.status === "active"
                  ? { label: `Deactivate ${student.name}`, icon: UserX, onClick: () => setToggling(student), danger: true }
                  : { label: `Activate ${student.name}`, icon: UserCheck, onClick: () => toggleStatus(student) },
              ]}
            />
          )}
        />
      </ListCard>

      <StudentFormModal student={editing} onClose={() => setEditing(null)} />

      <ConfirmDialog
        open={toggling !== null}
        onClose={() => setToggling(null)}
        onConfirm={() => {
          if (toggling) toggleStatus(toggling);
        }}
        title="Deactivate this student?"
        description={
          <>
            <strong className="text-slate-900">{toggling?.name}</strong> will not be able to log in or take tests until the
            account is activated again.
          </>
        }
        confirmLabel="Deactivate"
      />
    </>
  );
}
