import type { Metadata } from "next";
import { TestQuestions } from "@/components/tests/test-questions";

export const metadata: Metadata = {
  title: "Test questions",
};

export default async function TestQuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TestQuestions id={id} />;
}
