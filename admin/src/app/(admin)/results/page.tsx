import type { Metadata } from "next";
import { ResultsView } from "@/components/results/results-view";

export const metadata: Metadata = {
  title: "Test results",
};

export default function ResultsPage() {
  return <ResultsView />;
}
