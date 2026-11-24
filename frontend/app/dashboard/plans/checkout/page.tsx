import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PlanCheckout from "@/components/dashboard/PlanCheckout";

export const metadata: Metadata = {
  title: "Purchase | HN QBank",
  robots: { index: false },
};

type CheckoutPageProps = {
  searchParams: Promise<{ plan?: string | string[]; months?: string | string[] }>;
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// Reads ?plan= and ?months= from the address (set by "Buy Now"), so it sits inside Suspense
async function Checkout({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const plan = first(params.plan);
  const months = Number(first(params.months));
  // Opened without a choice: back to the plans
  if (!plan || !Number.isInteger(months)) redirect("/dashboard/plans");
  return <PlanCheckout planName={plan} months={months} />;
}

export default function PlanCheckoutPage({ searchParams }: CheckoutPageProps) {
  return (
    <DashboardShell title="QBank Edition 8">
      <Suspense fallback={null}>
        <Checkout searchParams={searchParams} />
      </Suspense>
    </DashboardShell>
  );
}
