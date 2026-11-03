"use client";

import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TestWizard } from "./test-wizard";

export function TestEditor({ id }: { id: string }) {
  const { tests } = useAdminStore();
  const test = tests.items.find((t) => t.id === id);

  if (!test) {
    return (
      <Card>
        <EmptyState
          icon={ClipboardList}
          title="Test not found"
          description="This test does not exist. It may have been deleted, or the demo data was reset by a refresh."
          action={
            <Link href="/tests" className={buttonStyles()}>
              Back to tests
            </Link>
          }
        />
      </Card>
    );
  }

  return <TestWizard key={test.id} test={test} />;
}
