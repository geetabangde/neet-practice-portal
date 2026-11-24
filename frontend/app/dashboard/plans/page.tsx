import type { Metadata } from "next";
import DashboardShell from "@/components/dashboard/DashboardShell";
import CurrentPlanBanner from "@/components/dashboard/CurrentPlanBanner";
import PlanGrid from "@/components/dashboard/PlanGrid";
import ReferralBox from "@/components/dashboard/ReferralBox";

export const metadata: Metadata = {
  title: "Plans | HN QBank",
  description: "Choose a plan for NEET PG and FMGE.",
  robots: { index: false },
};

export default function PlansPage() {
  return (
    <DashboardShell title="QBank Edition 8">
      <h1 className="text-center text-2xl font-bold sm:text-3xl">The Gold Standard for NEET PG &ndash; NExT</h1>

      <CurrentPlanBanner />

      <ReferralBox />

      <PlanGrid />
    </DashboardShell>
  );
}
