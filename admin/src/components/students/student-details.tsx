"use client";

import { ArrowLeft, Award, CalendarDays, Crown, GraduationCap, Mail, MapPin, Pencil, Phone, Target, UserCheck, UserX, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BarList } from "@/components/charts/bar-list";
import { AreaChart } from "@/components/charts/area-chart";
import { ActiveBadge, PaymentStatusBadge, paymentMethodLabels } from "@/components/common/status-badges";
import { PageHeader } from "@/components/common/page-header";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { indexById, resultAccuracy, scoreTone } from "@/lib/selectors";
import type { Payment, TestResult } from "@/types";
import { StudentFormModal } from "./student-form-modal";

type DetailTab = "overview" | "history" | "performance" | "subscription";

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <li className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="break-words text-sm font-medium text-slate-800">{value}</p>
      </div>
    </li>
  );
}

function MiniStat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Award }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <Icon className="h-5 w-5 text-indigo-500" aria-hidden="true" />
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export function StudentDetails({ id }: { id: string }) {
  const { students, plans, results, tests, subjects, payments } = useAdminStore();
  const toast = useToast();
  const [tab, setTab] = useState<DetailTab>("overview");
  const [editing, setEditing] = useState(false);
  const [confirmingDeactivate, setConfirmingDeactivate] = useState(false);

  const student = students.items.find((s) => s.id === id);

  if (!student) {
    return (
      <Card>
        <EmptyState
          icon={Users}
          title="Student not found"
          description="This student does not exist. The list may have changed since you opened this link."
          action={
            <Link href="/students" className={buttonStyles()}>
              Back to students
            </Link>
          }
        />
      </Card>
    );
  }

  const plan = plans.items.find((p) => p.id === student.planId);
  const testById = indexById(tests.items);
  const subjectById = indexById(subjects.items);

  const history = results
    .filter((result) => result.studentId === student.id)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt) || b.id.localeCompare(a.id));
  const paymentHistory = payments
    .filter((payment) => payment.studentId === student.id)
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt));

  const average = history.length
    ? Math.round(history.reduce((sum, r) => sum + resultAccuracy(r), 0) / history.length)
    : 0;
  const bestScore = history.reduce((best, r) => Math.max(best, Math.round((r.marksObtained / r.totalMarks) * 100)), 0);
  const totalPaid = paymentHistory
    .filter((payment) => payment.status === "success")
    .reduce((sum, payment) => sum + payment.amount, 0);

  // Accuracy per subject over all of this student's tests
  const bySubject = new Map<string, { correct: number; incorrect: number }>();
  for (const result of history) {
    for (const score of result.subjectScores) {
      const entry = bySubject.get(score.subjectId) ?? { correct: 0, incorrect: 0 };
      bySubject.set(score.subjectId, {
        correct: entry.correct + score.correct,
        incorrect: entry.incorrect + score.incorrect,
      });
    }
  }
  const subjectAccuracy = [...bySubject]
    .map(([subjectId, value]) => ({
      label: subjectById.get(subjectId)?.name ?? "Deleted subject",
      value: resultAccuracy(value),
    }))
    .sort((a, b) => b.value - a.value);

  // Accuracy of each attempt, oldest first
  const trend = [...history].reverse().map((result, index) => ({
    label: `#${index + 1}`,
    value: resultAccuracy(result),
  }));

  const historyColumns: Column<TestResult>[] = [
    {
      key: "test",
      header: "Test",
      primary: true,
      cell: (result) => <span className="font-medium text-slate-900">{testById.get(result.testId)?.title ?? "Deleted test"}</span>,
    },
    { key: "date", header: "Date", cell: (result) => formatDate(result.completedAt) },
    {
      key: "marks",
      header: "Marks",
      cell: (result) => (
        <span className="whitespace-nowrap">
          {result.marksObtained}
          <span className="text-slate-400">/{result.totalMarks}</span>
        </span>
      ),
    },
    {
      key: "accuracy",
      header: "Accuracy",
      cell: (result) => <Badge tone={scoreTone(resultAccuracy(result))}>{resultAccuracy(result)}%</Badge>,
    },
    { key: "rank", header: "Rank", cell: (result) => `#${result.rank}` },
  ];

  const paymentColumns: Column<Payment>[] = [
    { key: "id", header: "Transaction", primary: true, cell: (payment) => <span className="font-medium text-slate-900">{payment.id}</span> },
    { key: "date", header: "Date", cell: (payment) => formatDate(payment.paidAt) },
    { key: "amount", header: "Amount", cell: (payment) => formatCurrency(payment.amount) },
    { key: "method", header: "Method", cell: (payment) => paymentMethodLabels[payment.method] },
    { key: "status", header: "Status", cell: (payment) => <PaymentStatusBadge status={payment.status} /> },
  ];

  function activate() {
    students.update(student!.id, { status: "active" });
    toast({ title: "Student activated", description: `${student!.name} is now active.` });
  }

  return (
    <>
      <Link href="/students" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to students
      </Link>
      <PageHeader
        title={student.name}
        description={`Student ID ${student.id}`}
        actions={
          <>
            <Button variant="outline" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => setEditing(true)}>
              Edit student
            </Button>
            {student.status === "active" ? (
              <Button variant="danger" leftIcon={<UserX className="h-4 w-4" />} onClick={() => setConfirmingDeactivate(true)}>
                Deactivate
              </Button>
            ) : (
              <Button leftIcon={<UserCheck className="h-4 w-4" />} onClick={activate}>
                Activate
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Profile */}
        <Card className="h-fit">
          <CardContent>
            <div className="flex flex-col items-center text-center">
              <Avatar name={student.name} size="xl" />
              <h2 className="mt-4 text-lg font-semibold text-slate-900">{student.name}</h2>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                <ActiveBadge status={student.status} />
                {plan ? <Badge tone="indigo">{plan.name}</Badge> : <Badge>No plan</Badge>}
              </div>
            </div>
            <ul className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
              <InfoRow icon={Mail} label="Email" value={student.email} />
              <InfoRow icon={Phone} label="Mobile" value={student.phone} />
              <InfoRow icon={MapPin} label="City" value={student.city} />
              <InfoRow icon={GraduationCap} label="College" value={student.college} />
              <InfoRow icon={CalendarDays} label="Registered" value={formatDate(student.registeredAt)} />
              <InfoRow icon={CalendarDays} label="Last active" value={formatDate(student.lastActiveAt)} />
            </ul>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="min-w-0 space-y-6">
          <Tabs
            variant="underline"
            ariaLabel="Student details"
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "overview", label: "Overview" },
              { value: "history", label: "Test history", count: history.length },
              { value: "performance", label: "Performance" },
              { value: "subscription", label: "Subscription" },
            ]}
          />

          {tab === "overview" ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MiniStat icon={Award} label="Tests attempted" value={formatNumber(history.length)} />
                <MiniStat icon={Target} label="Average accuracy" value={`${average}%`} />
                <MiniStat icon={Award} label="Best score" value={`${bestScore}%`} />
                <MiniStat icon={Crown} label="Total paid" value={formatCurrency(totalPaid)} />
              </div>
              <Card>
                <CardHeader title="Latest attempts" />
                <div className="pt-3">
                  <DataTable
                    caption="Latest test attempts"
                    columns={historyColumns}
                    rows={history.slice(0, 4)}
                    getRowId={(r) => r.id}
                    empty={<EmptyState icon={Award} title="No tests yet" description="This student has not attempted a test." />}
                  />
                </div>
              </Card>
            </>
          ) : null}

          {tab === "history" ? (
            <Card className="overflow-hidden">
              <DataTable
                caption="Test history"
                columns={historyColumns}
                rows={history}
                getRowId={(r) => r.id}
                empty={<EmptyState icon={Award} title="No tests yet" description="This student has not attempted a test." />}
                actions={(result) => (
                  <Link href={`/results/${result.id}`} className={buttonStyles({ variant: "ghost", size: "sm" })}>
                    Details
                  </Link>
                )}
              />
            </Card>
          ) : null}

          {tab === "performance" ? (
            history.length === 0 ? (
              <Card>
                <EmptyState icon={Target} title="No performance data" description="Performance appears after the first test." />
              </Card>
            ) : (
              <div className="grid gap-6 xl:grid-cols-2">
                <Card>
                  <CardHeader title="Accuracy by subject" description="All tests combined" />
                  <CardContent>
                    <BarList data={subjectAccuracy} measure="accuracy" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader title="Accuracy per attempt" description="Oldest to newest" />
                  <CardContent>
                    {trend.length > 1 ? (
                      <AreaChart data={trend} title="Accuracy per attempt" format={(v) => `${v}%`} height={200} />
                    ) : (
                      <p className="py-10 text-center text-sm text-slate-500">At least two attempts are needed for a trend.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )
          ) : null}

          {tab === "subscription" ? (
            <>
              <Card>
                <CardHeader title="Current plan" />
                <CardContent>
                  {plan ? (
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xl font-semibold text-slate-900">{plan.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatCurrency(plan.price)} for {plan.durationMonths} months
                        </p>
                        {student.planExpiresAt ? (
                          <p className="mt-3 text-sm text-slate-700">
                            Valid until <strong>{formatDate(student.planExpiresAt)}</strong>
                          </p>
                        ) : null}
                      </div>
                      <ul className="max-w-xs space-y-1.5 text-sm text-slate-600">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" aria-hidden="true" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">This student has no paid plan yet.</p>
                  )}
                </CardContent>
              </Card>
              <Card className="overflow-hidden">
                <CardHeader title="Payment history" className="pb-3" />
                <DataTable
                  caption="Payment history"
                  columns={paymentColumns}
                  rows={paymentHistory}
                  getRowId={(p) => p.id}
                  empty={<EmptyState icon={Crown} title="No payments" description="No payments were made by this student." />}
                />
              </Card>
            </>
          ) : null}
        </div>
      </div>

      <StudentFormModal student={editing ? student : null} onClose={() => setEditing(false)} />
      <ConfirmDialog
        open={confirmingDeactivate}
        onClose={() => setConfirmingDeactivate(false)}
        onConfirm={() => {
          students.update(student.id, { status: "inactive" });
          toast({ title: "Student deactivated", description: `${student.name} is now inactive.` });
        }}
        title="Deactivate this student?"
        description={
          <>
            <strong className="text-slate-900">{student.name}</strong> will not be able to log in or take tests until the
            account is activated again.
          </>
        }
        confirmLabel="Deactivate"
      />
    </>
  );
}
