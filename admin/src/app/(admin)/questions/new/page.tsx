import type { Metadata } from "next";
import { QuestionForm } from "@/components/questions/question-form";

export const metadata: Metadata = {
  title: "Add question",
};

export default function NewQuestionPage() {
  return <QuestionForm />;
}
