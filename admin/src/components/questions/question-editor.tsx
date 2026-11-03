"use client";

import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { QuestionForm } from "./question-form";

// Finds the question in the store and shows the edit form for it
export function QuestionEditor({ id }: { id: string }) {
  const { questions } = useAdminStore();
  const question = questions.items.find((q) => q.id === id);

  if (!question) {
    return (
      <Card>
        <EmptyState
          icon={FileQuestion}
          title="Question not found"
          description="This question does not exist. It may have been deleted, or the demo data was reset by a refresh."
          action={
            <Link href="/questions" className={buttonStyles()}>
              Back to question bank
            </Link>
          }
        />
      </Card>
    );
  }

  // The key makes the form start fresh if another question is opened
  return <QuestionForm key={question.id} question={question} />;
}
