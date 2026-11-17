import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import InstructionAccordion from "@/components/dashboard/InstructionAccordion";
import InstructionBlocks from "@/components/dashboard/InstructionBlocks";
import StartTestFlow from "@/components/dashboard/StartTestFlow";
import { testSeriesYear } from "@/data/dashboard";
import {
  generalInstructions,
  ndaParagraphs,
  ndaTitle,
  otherInstructions,
} from "@/data/testInstructions";

export const metadata: Metadata = {
  title: "Test instructions | HN QBank",
  robots: { index: false },
};

type InstructionsPageProps = {
  searchParams: Promise<{ id?: string | string[] }>;
};

// Reads ?id= from the address (set by "Start Test"), so it sits inside Suspense
async function Instructions({ searchParams }: InstructionsPageProps) {
  const { id } = await searchParams;
  const testId = Array.isArray(id) ? id[0] : id;

  // No test chosen (page opened directly): go to the list, where Start Test picks one
  if (!testId) redirect("/dashboard/test-series");

  return (
    <>
      <InstructionAccordion title="Instructions">
        <InstructionBlocks groups={generalInstructions} />
      </InstructionAccordion>

      <StartTestFlow
        testId={testId}
        instructions={<InstructionBlocks groups={otherInstructions} />}
        ndaTitle={ndaTitle}
        ndaParagraphs={ndaParagraphs}
      />
    </>
  );
}

export default function TestInstructionsPage({ searchParams }: InstructionsPageProps) {
  return (
    <DashboardShell title="QBank Edition 8">
      <h1 className="mt-1 text-2xl font-bold">Test Series</h1>
      <p className="mt-1 text-xs font-semibold uppercase">Year {testSeriesYear}</p>

      <Suspense fallback={null}>
        <Instructions searchParams={searchParams} />
      </Suspense>
    </DashboardShell>
  );
}
