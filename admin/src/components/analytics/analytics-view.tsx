"use client";

import { Download, FileCheck2, IndianRupee, TrendingUp, UserPlus } from "lucide-react";
import { useState } from "react";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { BarList } from "@/components/charts/bar-list";
import { DonutChart } from "@/components/charts/donut-chart";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { getAnalytics, rangeLabels, rangeOptions, type AnalyticsKpi } from "@/data/analytics";
import { formatCompact, formatCurrency, formatNumber } from "@/lib/format";
import type { DateRange } from "@/types";

const kpiIcons = [UserPlus, FileCheck2, TrendingUp, IndianRupee] as const;
const kpiTones = ["indigo", "blue", "violet", "amber"] as const;

function formatKpi(kpi: AnalyticsKpi): string {
  if (kpi.format === "percent") return `${kpi.value}%`;
  if (kpi.format === "currency") return `₹${formatCompact(kpi.value)}`;
  return formatNumber(kpi.value);
}

export function AnalyticsView() {
  const { students, plans } = useAdminStore();
  const toast = useToast();
  const [range, setRange] = useState<DateRange>("30d");

  const data = getAnalytics(range);
  const comparison = `vs the period before`;

  // Students per plan, for the subscription chart
  const subscriptionData = [
    ...plans.items.map((plan) => ({
      label: plan.name,
      value: students.items.filter((s) => s.planId === plan.id).length,
    })),
    { label: "No plan", value: students.items.filter((s) => s.planId === null).length },
  ].filter((entry) => entry.value > 0);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Trends in students, tests and revenue. Change the period to compare."
        actions={
          <>
            <Tabs ariaLabel="Date range" value={range} onChange={setRange} tabs={rangeOptions} />
            <Button
              variant="outline"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => toast({ title: "Report export started", description: `${rangeLabels[range]}. Demo only: no file is created yet.` })}
            >
              Export
            </Button>
          </>
        }
      />

      <section aria-label={`Key numbers, ${rangeLabels[range]}`} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi, index) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={formatKpi(kpi)}
            icon={kpiIcons[index]}
            tone={kpiTones[index]}
            change={kpi.change}
            comparison={comparison}
          />
        ))}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Student growth" description={`New registrations, ${rangeLabels[range].toLowerCase()}`} />
          <CardContent>
            <AreaChart
              data={data.studentGrowth}
              title="New students"
              format={(v) => `${v} students`}
              formatTick={(v) => String(v)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Test participation" description="Number of test attempts" />
          <CardContent>
            <BarChart data={data.testParticipation} title="Test attempts" format={(v) => `${formatNumber(v)} attempts`} formatTick={(v) => formatCompact(v)} colorIndex={2} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Average test score" description="Mean score of all attempts, in percent" />
          <CardContent>
            <AreaChart data={data.averageScores} title="Average score" format={(v) => `${v}%`} formatTick={(v) => `${v}%`} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Revenue" description="Successful payments in the period" />
          <CardContent>
            <BarChart
              data={data.revenue}
              title="Revenue"
              format={formatCurrency}
              formatTick={(v) => `₹${formatCompact(v)}`}
              colorIndex={3}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader title="Subject-wise performance" description="Average score by subject" />
          <CardContent>
            <BarList data={[...data.subjectPerformance].sort((a, b) => b.value - a.value)} measure="average score" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Topic-wise performance" description="Accuracy, strongest to weakest topic" />
          <CardContent>
            <BarList data={[...data.topicPerformance].sort((a, b) => b.value - a.value)} measure="accuracy" />
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Question accuracy" description="Share of correct answers by difficulty" />
            <CardContent>
              <BarList data={data.questionAccuracy} measure="accuracy" />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader title="Subscription analytics" description="Students on each plan right now" />
          <CardContent>
            <DonutChart
              title="Students per plan"
              data={subscriptionData}
              centerValue={String(students.items.length)}
              centerLabel="students"
              format={(v) => `${v} students`}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
