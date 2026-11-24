"use client";

import { Download, FileCheck2, IndianRupee, TrendingUp, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
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
import { rangeLabels, rangeOptions, type AnalyticsData, type AnalyticsKpi } from "@/data/analytics";
import { fetchAnalytics } from "@/lib/analytics-api";
import { formatCompact, formatCurrency, formatNumber } from "@/lib/format";
import type { ChartPoint, DateRange } from "@/types";

const kpiIcons = [UserPlus, FileCheck2, TrendingUp, IndianRupee] as const;
const kpiTones = ["indigo", "blue", "violet", "amber"] as const;

function formatKpi(kpi: AnalyticsKpi): string {
  if (kpi.format === "percent") return `${kpi.value}%`;
  if (kpi.format === "currency") return `₹${formatCompact(kpi.value)}`;
  return formatNumber(kpi.value);
}

// What came back for one period. "range" says which period it is for, so a screen that asks for another
// period knows the answer on show is old.
type Loaded = { range: DateRange; data: AnalyticsData } | { range: DateRange; error: string };

const cell = (value: string | number) => {
  const text = String(value);
  // A cell that starts with = + - or @ could be run as a formula by Excel, so it gets a ' in front
  return `"${(/^[=+\-@]/.test(text) ? `'${text}` : text).replace(/"/g, '""')}"`;
};

export function AnalyticsView() {
  const { students, plans } = useAdminStore();
  const toast = useToast();
  const [range, setRange] = useState<DateRange>("30d");
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await fetchAnalytics(range);
      if (cancelled) return;
      setLoaded(result.ok ? { range, data: result.data } : { range, error: result.message });
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [range, attempt]);

  const current = loaded?.range === range ? loaded : null;
  const data = current && "data" in current ? current.data : null;
  const error = current && "error" in current ? current.error : null;
  const comparison = `vs the period before`;

  // Students per plan, for the subscription chart
  const subscriptionData = [
    ...plans.items.map((plan) => ({
      label: plan.name,
      value: students.items.filter((s) => s.planId === plan.id).length,
    })),
    { label: "No plan", value: students.items.filter((s) => s.planId === null).length },
  ].filter((entry) => entry.value > 0);

  // The numbers and every chart of the period, as one CSV file (opens in Excel)
  const exportCsv = () => {
    if (!data) return;
    const series: [string, ChartPoint[]][] = [
      ["New students", data.studentGrowth],
      ["Test attempts", data.testParticipation],
      ["Average score (%)", data.averageScores],
      ["Revenue (Rs)", data.revenue],
      ["Subject-wise performance (%)", data.subjectPerformance],
      ["Topic-wise performance (%)", data.topicPerformance],
      ["Question accuracy (%)", data.questionAccuracy],
    ];
    const rows: (string | number)[][] = [
      ["Analytics", rangeLabels[range]],
      [],
      ["Key numbers", "Value", "Change vs the period before"],
      ...data.kpis.map((kpi) => [kpi.label, kpi.value, `${kpi.change}${kpi.format === "percent" ? " points" : "%"}`]),
      ...series.flatMap(([title, points]) => [[], [title, "Value"], ...points.map((p) => [p.label, p.value])]),
    ];
    const csv = rows.map((row) => row.map(cell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics-${range}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report exported", description: `${rangeLabels[range]} saved as analytics-${range}.csv.` });
  };

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Trends in students, tests and revenue. Change the period to compare."
        actions={
          <>
            <Tabs ariaLabel="Date range" value={range} onChange={setRange} tabs={rangeOptions} />
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={exportCsv} disabled={!data}>
              Export
            </Button>
          </>
        }
      />

      {error ? (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load the analytics from the server.
          <Button size="sm" variant="outline" onClick={() => setAttempt((value) => value + 1)}>
            Try again
          </Button>
        </div>
      ) : null}

      {!data && !error ? (
        <p role="status" className="rounded-lg bg-white px-4 py-3 text-sm text-slate-600">
          Loading the analytics...
        </p>
      ) : null}

      {data ? (
        <>
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
              <CardHeader title="Revenue" description="Plans bought in the period" />
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
              <CardHeader title="Subject-wise performance" description="Share of answers that were right, by subject" />
              <CardContent>
                {data.subjectPerformance.length > 0 ? (
                  <BarList data={[...data.subjectPerformance].sort((a, b) => b.value - a.value)} measure="accuracy" />
                ) : (
                  <p className="text-sm text-slate-500">No test answers in this period yet.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader title="Topic-wise performance" description="Accuracy in the ten most answered topics" />
              <CardContent>
                {data.topicPerformance.length > 0 ? (
                  <BarList data={[...data.topicPerformance].sort((a, b) => b.value - a.value)} measure="accuracy" />
                ) : (
                  <p className="text-sm text-slate-500">No test answers in this period yet.</p>
                )}
              </CardContent>
            </Card>
            <div className="space-y-6">
              <Card>
                <CardHeader title="Question accuracy" description="Share of correct answers by difficulty" />
                <CardContent>
                  {data.questionAccuracy.length > 0 ? (
                    <BarList data={data.questionAccuracy} measure="accuracy" />
                  ) : (
                    <p className="text-sm text-slate-500">No test answers in this period yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : null}

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
