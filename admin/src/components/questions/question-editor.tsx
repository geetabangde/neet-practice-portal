"use client";

import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { QuestionForm } from "./question-form";

// Finds the question in the store and shows the edit form for it
export function QuestionEditor({ id }: { id: string }) {
  const { questions, contentStatus, reloadContent } = useAdminStore();
  const question = questions.items.find((q) => q.id === id);

  // Opened straight from a link: wait for the server before saying the question is missing
  if (!question && contentStatus === "loading") {
    return (
      <p role="status" className="py-16 text-center text-sm text-slate-500">
        Loading question…
      </p>
    );
  }

  if (!question && contentStatus === "error") {
    return (
      <Card>
        <EmptyState
          icon={FileQuestion}
          title="Could not load the question"
          description="The server did not respond. Check that the backend is running."
          action={<Button onClick={reloadContent}>Try again</Button>}
        />
      </Card>
    );
  }

  if (!question) {
    return (
      <Card>
        <EmptyState
          icon={FileQuestion}
          title="Question not found"
          description="This question does not exist. It may have been deleted."
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
