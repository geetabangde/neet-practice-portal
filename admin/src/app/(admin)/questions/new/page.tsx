import type { Metadata } from "next";
import { QuestionForm } from "@/components/questions/question-form";

export const metadata: Metadata = {
  title: "Add question",
};

export default async function NewQuestionPage({
  searchParams,
}: {
  searchParams?: Promise<{ subjectId?: string; moduleId?: string; topicId?: string; returnUrl?: string }>;
}) {
  const params = await searchParams;
  return (
    <QuestionForm
      initialSubjectId={params?.subjectId}
      initialModuleId={params?.moduleId}
      initialTopicId={params?.topicId}
      returnUrl={params?.returnUrl}
    />
  );
}
