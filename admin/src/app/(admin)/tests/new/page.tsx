import type { Metadata } from "next";
import { TestForm } from "@/components/tests/test-form";

export const metadata: Metadata = {
  title: "Create test",
};

export default function NewTestPage() {
  return <TestForm />;
}
