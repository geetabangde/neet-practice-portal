"use client";

import { ClipboardList, Crown, FileQuestion, IndianRupee, UserCheck, Users } from "lucide-react";
import { StatCard } from "@/components/common/stat-card";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { statTrends, trendComparison } from "@/data/dashboard";
import { formatCompact, formatNumber } from "@/lib/format";

// The six numbers at the top of the dashboard. They are counted from the shared store,
// so adding a student or a question changes them straight away. The percentage changes
// are fixed dummy numbers.
export function StatsGrid() {
  const { students, questions, tests, payments } = useAdminStore();

  const revenue = payments
    .filter((payment) => payment.status === "success")
    .reduce((sum, payment) => sum + payment.amount, 0);

  const activeStudents = students.items.filter((student) => student.status === "active").length;
  const activeSubscriptions = students.items.filter(
    (student) => student.planId !== null && student.status === "active",
  ).length;

  return (
    <section aria-label="Key numbers" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard
        label="Total students"
        value={formatNumber(students.items.length)}
        icon={Users}
        tone="indigo"
        change={statTrends.students}
        comparison={trendComparison}
      />
      <StatCard
        label="Active students"
        value={formatNumber(activeStudents)}
        icon={UserCheck}
        tone="emerald"
        change={statTrends.activeStudents}
        comparison={trendComparison}
      />
      <StatCard
        label="Total questions"
        value={formatNumber(questions.items.length)}
        icon={FileQuestion}
        tone="blue"
        change={statTrends.questions}
        comparison={trendComparison}
      />
      <StatCard
        label="Total tests"
        value={formatNumber(tests.items.length)}
        icon={ClipboardList}
        tone="violet"
        change={statTrends.tests}
        comparison={trendComparison}
      />
      <StatCard
        label="Total revenue"
        value={`₹${formatCompact(revenue)}`}
        icon={IndianRupee}
        tone="amber"
        change={statTrends.revenue}
        comparison={trendComparison}
      />
      <StatCard
        label="Active subscriptions"
        value={formatNumber(activeSubscriptions)}
        icon={Crown}
        tone="rose"
        change={statTrends.subscriptions}
        comparison={trendComparison}
      />
    </section>
  );
}
