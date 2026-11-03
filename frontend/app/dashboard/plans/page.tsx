import type { Metadata } from "next";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PlanCard from "@/components/dashboard/PlanCard";
import ReferralBox from "@/components/dashboard/ReferralBox";
import { plans } from "@/data/dashboard";

export const metadata: Metadata = {
  title: "Plans | HN QBank",
  description: "Choose a plan for NEET PG and FMGE.",
  robots: { index: false },
};

export default function PlansPage() {
  return (
    <DashboardShell title="QBank Edition 8">
      <h1 className="text-center text-2xl font-bold sm:text-3xl">The Gold Standard for NEET PG &ndash; NExT</h1>

      <ReferralBox />

      <div className="mt-8 grid items-stretch gap-6 lg:grid-cols-3 lg:gap-5">
        {plans.map((plan) => (
          <PlanCard key={plan.name} plan={plan} />
        ))}
      </div>
    </DashboardShell>
  );
}
