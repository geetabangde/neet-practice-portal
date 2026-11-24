import type { Metadata } from "next";
import { QuestionsView } from "@/components/questions/questions-view";

export const metadata: Metadata = {
  title: "Question bank",
};

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ subjectId?: string; topicId?: string; q?: string }>;
}) {
  const params = await searchParams;
  return (
    <QuestionsView
      initialSubject={params?.subjectId ?? "all"}
      initialTopic={params?.topicId ?? "all"}
      initialQuery={params?.q ?? ""}
    />
  );
}
