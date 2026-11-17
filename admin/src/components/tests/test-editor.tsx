"use client";

import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TestForm } from "./test-form";

export function TestEditor({ id }: { id: string }) {
  const { tests, contentStatus, reloadContent } = useAdminStore();
  const test = tests.items.find((t) => t.id === id);

  // Opened straight from a link: wait for the server before saying the test is missing
  if (!test && contentStatus === "loading") {
    return (
      <p role="status" className="py-16 text-center text-sm text-slate-500">
        Loading test…
      </p>
    );
  }

  if (!test && contentStatus === "error") {
    return (
      <Card>
        <EmptyState
          icon={ClipboardList}
          title="Could not load the test"
          description="The server did not respond. Check that the backend is running."
          action={<Button onClick={reloadContent}>Try again</Button>}
        />
      </Card>
    );
  }

  if (!test) {
    return (
      <Card>
        <EmptyState
          icon={ClipboardList}
          title="Test not found"
          description="This test does not exist. It may have been deleted."
          action={
            <Link href="/tests" className={buttonStyles()}>
              Back to tests
            </Link>
          }
        />
      </Card>
    );
  }

  return <TestForm key={test.id} test={test} />;
}
