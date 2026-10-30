import type { Metadata } from "next";
import DashboardShell from "@/components/dashboard/DashboardShell";
import TestAttempt from "@/components/dashboard/TestAttempt";
import { testAttemptQuestions, testAttemptSampleStatuses, testAttemptTotal } from "@/data/dashboard";

export const metadata: Metadata = {
  title: "Test | HN QBank",
  robots: { index: false },
};

export default function TestAttemptPage() {
  return (
    <DashboardShell title="QBank Edition 8">
      <TestAttempt
        total={testAttemptTotal}
        questions={testAttemptQuestions}
        sampleStatuses={testAttemptSampleStatuses}
      />
    </DashboardShell>
  );
}
