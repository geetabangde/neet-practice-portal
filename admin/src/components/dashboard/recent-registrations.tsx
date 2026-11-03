"use client";

import Link from "next/link";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { buttonStyles } from "@/components/ui/button";

export function RecentRegistrations() {
  const { students, plans } = useAdminStore();
  const planName = new Map(plans.items.map((plan) => [plan.id, plan.name]));

  const latest = [...students.items]
    .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt) || b.id.localeCompare(a.id))
    .slice(0, 5);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Recent registrations"
        action={
          <Link href="/students" className={buttonStyles({ variant: "ghost", size: "sm" })}>
            View all
          </Link>
        }
      />
      <ul className="flex-1 divide-y divide-slate-100 px-5 pb-2 pt-2">
        {latest.map((student) => (
          <li key={student.id} className="flex items-center gap-3 py-3">
            <Avatar name={student.name} />
            <div className="min-w-0 flex-1">
              <Link href={`/students/${student.id}`} className="block truncate text-sm font-medium text-slate-900 hover:text-indigo-700">
                {student.name}
              </Link>
              <p className="truncate text-xs text-slate-500">{formatDate(student.registeredAt)}</p>
            </div>
            {student.planId ? (
              <Badge tone="indigo">{planName.get(student.planId) ?? "Plan"}</Badge>
            ) : (
              <Badge>No plan</Badge>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
