import type { Metadata } from "next";
import { TestWizard } from "@/components/tests/test-wizard";

export const metadata: Metadata = {
  title: "Create test",
};

export default function NewTestPage() {
  return <TestWizard />;
}
