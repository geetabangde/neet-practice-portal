import type { Metadata } from "next";
import { QuestionImport } from "@/components/questions/question-import";

export const metadata: Metadata = {
  title: "Import questions",
};

export default function ImportQuestionsPage() {
  return <QuestionImport />;
}
