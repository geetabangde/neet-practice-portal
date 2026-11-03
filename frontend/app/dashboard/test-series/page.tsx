import type { Metadata } from "next";
import DashboardShell from "@/components/dashboard/DashboardShell";
import TestSeriesView from "@/components/dashboard/TestSeriesView";
import { testSeries, testSeriesYear } from "@/data/dashboard";

export const metadata: Metadata = {
  title: "Test Series | HN QBank",
  robots: { index: false },
};

export default function TestSeriesPage() {
  return (
    <DashboardShell title="QBank Edition 8">
      <TestSeriesView year={testSeriesYear} tests={testSeries} />
    </DashboardShell>
  );
}
