"use client";

import Link from "next/link";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { indexById, resultAccuracy, scoreTone } from "@/lib/selectors";

export function RecentAttempts() {
  const { results, students, tests } = useAdminStore();
  const studentById = indexById(students.items);
  const testById = indexById(tests.items);

  const latest = [...results]
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt) || b.id.localeCompare(a.id))
    .slice(0, 5);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Recent test attempts"
        action={
          <Link href="/results" className={buttonStyles({ variant: "ghost", size: "sm" })}>
            View all
          </Link>
        }
      />
      <ul className="flex-1 divide-y divide-slate-100 px-5 pb-2 pt-2">
        {latest.map((result) => {
          const student = studentById.get(result.studentId);
          const test = testById.get(result.testId);
          const accuracy = resultAccuracy(result);
          return (
            <li key={result.id} className="flex items-center gap-3 py-3">
              <Avatar name={student?.name ?? "?"} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{student?.name ?? "Unknown student"}</p>
                <p className="truncate text-xs text-slate-500">
                  {test?.title ?? "Deleted test"} · {formatDate(result.completedAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">
                  {result.marksObtained}
                  <span className="font-normal text-slate-400">/{result.totalMarks}</span>
                </p>
                <Badge tone={scoreTone(accuracy)} className="mt-0.5">
                  {accuracy}%
                </Badge>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
