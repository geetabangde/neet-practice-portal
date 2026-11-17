import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import TestAttemptView from "@/components/dashboard/TestAttemptView";

export const metadata: Metadata = {
  title: "Test | HN QBank",
  robots: { index: false },
};

type AttemptPageProps = {
  searchParams: Promise<{ id?: string | string[] }>;
};

// Reads ?id= from the address (set by the instructions page), so it sits inside Suspense
async function Attempt({ searchParams }: AttemptPageProps) {
  const { id } = await searchParams;
  const testId = Array.isArray(id) ? id[0] : id;

  // No test chosen (page opened directly): go to the list
  if (!testId) redirect("/dashboard/test-series");
  return <TestAttemptView testId={testId} />;
}

export default function TestAttemptPage({ searchParams }: AttemptPageProps) {
  return (
    <DashboardShell title="QBank Edition 8">
      <Suspense fallback={null}>
        <Attempt searchParams={searchParams} />
      </Suspense>
    </DashboardShell>
  );
}
