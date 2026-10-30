import type { Metadata } from "next";
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

export default function TestInstructionsPage() {
  return (
    <DashboardShell title="QBank Edition 8">
      <h1 className="mt-1 text-2xl font-bold">Test Series</h1>
      <p className="mt-1 text-xs font-semibold uppercase">Year {testSeriesYear}</p>

      <InstructionAccordion title="Instructions">
        <InstructionBlocks groups={generalInstructions} />
      </InstructionAccordion>

      <StartTestFlow
        instructions={<InstructionBlocks groups={otherInstructions} />}
        ndaTitle={ndaTitle}
        ndaParagraphs={ndaParagraphs}
      />
    </DashboardShell>
  );
}
