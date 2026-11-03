"use client";

import { CheckCircle2, Clock, Eye, IndianRupee, Receipt, RotateCcw, XCircle } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { ListCard } from "@/components/common/list-card";
import { RowActions } from "@/components/common/row-actions";
import { PaymentStatusBadge, paymentMethodLabels } from "@/components/common/status-badges";
import { StatCard } from "@/components/common/stat-card";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/form-controls";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { usePagination } from "@/hooks/use-pagination";
import { formatCompact, formatCurrency, formatDate } from "@/lib/format";
import { indexById } from "@/lib/selectors";
import type { Payment } from "@/types";
import { PaymentDetailsModal } from "./payment-details-modal";

const PAGE_SIZE = 10;

export function PaymentsView() {
  const { payments, students, plans } = useAdminStore();
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [method, setMethod] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [viewing, setViewing] = useState<Payment | null>(null);

  const studentById = indexById(students.items);
  const planById = indexById(plans.items);
  const term = query.trim().toLowerCase();

  const filtered = [...payments]
    .filter((payment) => {
      if (status !== "all" && payment.status !== status) return false;
      if (method !== "all" && payment.method !== method) return false;
      if (planFilter !== "all" && payment.planId !== planFilter) return false;
      if (!term) return true;
      return payment.id.toLowerCase().includes(term) || (studentById.get(payment.studentId)?.name ?? "").toLowerCase().includes(term);
    })
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt) || b.id.localeCompare(a.id));
  const pagination = usePagination(filtered, PAGE_SIZE);

  const sum = (list: Payment[]) => list.reduce((total, p) => total + p.amount, 0);
  const by = (value: Payment["status"]) => payments.filter((p) => p.status === value);

  const columns: Column<Payment>[] = [
    {
      key: "id",
      header: "Transaction ID",
      primary: true,
      cell: (payment) => <span className="whitespace-nowrap font-medium text-slate-900">{payment.id}</span>,
    },
    {
      key: "student",
      header: "Student",
      cell: (payment) => {
        const student = studentById.get(payment.studentId);
        return (
          <span className="flex items-center gap-2.5">
            <Avatar name={student?.name ?? "?"} size="sm" />
            <span className="truncate">{student?.name ?? "Deleted student"}</span>
          </span>
        );
      },
    },
    { key: "plan", header: "Plan", hideBelow: "lg", cell: (payment) => planById.get(payment.planId)?.name ?? "Deleted plan" },
    { key: "amount", header: "Amount", align: "right", cell: (payment) => <span className="font-medium text-slate-900">{formatCurrency(payment.amount)}</span> },
    { key: "method", header: "Method", hideBelow: "xl", cell: (payment) => paymentMethodLabels[payment.method] },
    { key: "date", header: "Date", cell: (payment) => <span className="whitespace-nowrap">{formatDate(payment.paidAt)}</span> },
    { key: "status", header: "Status", cell: (payment) => <PaymentStatusBadge status={payment.status} /> },
  ];

  const clearFilters = () => {
    setQuery("");
    setStatus("all");
    setMethod("all");
    setPlanFilter("all");
  };

  return (
    <>
      <PageHeader
        title="Payments"
        description="Every transaction made by students (dummy data)."
        actions={
          <Button variant="outline" onClick={() => toast({ title: "Export started", description: "Demo only: no file is created yet." })}>
            Export payments
          </Button>
        }
      />

      <section aria-label="Payment totals" className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Collected" value={`₹${formatCompact(sum(by("success")))}`} icon={IndianRupee} tone="emerald" />
        <StatCard label="Pending" value={`₹${formatCompact(sum(by("pending")))}`} icon={Clock} tone="amber" />
        <StatCard label="Failed" value={String(by("failed").length)} icon={XCircle} tone="rose" />
        <StatCard label="Refunded" value={`₹${formatCompact(sum(by("refunded")))}`} icon={RotateCcw} tone="violet" />
      </section>

      <ListCard
        toolbar={
          <div className="grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <SearchInput value={query} onChange={setQuery} placeholder="Search transaction ID or student" />
            <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </Select>
            <Select aria-label="Filter by payment method" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="all">All methods</option>
              {Object.entries(paymentMethodLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Select aria-label="Filter by plan" value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
              <option value="all">All plans</option>
              {plans.items.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
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
            noun="transactions"
          />
        }
      >
        <DataTable
          caption="Payments"
          columns={columns}
          rows={pagination.pageItems}
          getRowId={(payment) => payment.id}
          empty={
            <EmptyState
              icon={Receipt}
              title="No transactions found"
              description="No payment matches these filters."
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          }
          actions={(payment) => (
            <RowActions actions={[{ label: `View ${payment.id}`, icon: Eye, onClick: () => setViewing(payment) }]} />
          )}
        />
      </ListCard>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        Gateway references are placeholders. No real payment provider is connected.
      </p>

      <PaymentDetailsModal payment={viewing} onClose={() => setViewing(null)} />
    </>
  );
}
