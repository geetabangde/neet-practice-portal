import type { Metadata } from "next";
import { TestsView } from "@/components/tests/tests-view";

export const metadata: Metadata = {
  title: "Test management",
};

export default function TestsPage() {
  return <TestsView />;
}
