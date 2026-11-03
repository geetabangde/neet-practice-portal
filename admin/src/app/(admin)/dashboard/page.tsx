import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { AttemptsChart } from "@/components/dashboard/attempts-chart";
import { DashboardActions } from "@/components/dashboard/dashboard-actions";
import { RecentAttempts } from "@/components/dashboard/recent-attempts";
import { RecentRegistrations } from "@/components/dashboard/recent-registrations";
import { RegistrationChart } from "@/components/dashboard/registration-chart";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { SubjectPerformance } from "@/components/dashboard/subject-performance";
import { TopStudents } from "@/components/dashboard/top-students";

export const metadata: Metadata = {
  title: "Dashboard",
};

// A server page that only arranges the dashboard pieces. Each piece is its own component.
export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Welcome back, Anita. Here is what is happening on the platform."
        actions={<DashboardActions />}
      />

      <StatsGrid />

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RegistrationChart />
        </div>
        <SubjectPerformance />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart />
        </div>
        <AttemptsChart />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <RecentRegistrations />
        <RecentAttempts />
        <TopStudents />
      </div>

      <div className="mt-6">
        <ActivityFeed />
      </div>
    </>
  );
}
