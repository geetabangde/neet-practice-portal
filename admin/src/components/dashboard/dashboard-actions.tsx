"use client";

import { CalendarDays, Download } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";

// The buttons next to the dashboard heading
export function DashboardActions() {
  const toast = useToast();
  return (
    <>
      <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 shadow-sm">
        <CalendarDays className="h-4 w-4 text-slate-400" aria-hidden="true" />
        Oct 2026
      </span>
      <Button
        leftIcon={<Download className="h-4 w-4" />}
        onClick={() => toast({ title: "Report export started", description: "Demo only: no file is created yet." })}
      >
        Export report
      </Button>
    </>
  );
}
