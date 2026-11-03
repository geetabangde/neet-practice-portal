"use client";

import { Trophy } from "lucide-react";
import Link from "next/link";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { indexById, resultAccuracy } from "@/lib/selectors";

const medals = ["bg-amber-100 text-amber-700", "bg-slate-100 text-slate-600", "bg-orange-100 text-orange-700"];

export function TopStudents() {
  const { results, students } = useAdminStore();
  const studentById = indexById(students.items);

  // Average accuracy of every student who has taken at least two tests
  const perStudent = new Map<string, number[]>();
  for (const result of results) {
    perStudent.set(result.studentId, [...(perStudent.get(result.studentId) ?? []), resultAccuracy(result)]);
  }

  const ranking = [...perStudent]
    .filter(([, scores]) => scores.length >= 2)
    .map(([studentId, scores]) => ({
      studentId,
      tests: scores.length,
      average: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
    }))
    .sort((a, b) => b.average - a.average || a.studentId.localeCompare(b.studentId))
    .slice(0, 5);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader title="Top performing students" description="Average accuracy, at least two tests" />
      <ol className="flex-1 space-y-1 px-5 pb-5 pt-3">
        {ranking.map((entry, index) => {
          const student = studentById.get(entry.studentId);
          return (
            <li key={entry.studentId} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-slate-50">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  medals[index] ?? "bg-slate-50 text-slate-500",
                )}
              >
                {index === 0 ? <Trophy className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}
                <span className="sr-only">Rank {index + 1}</span>
              </span>
              <Avatar name={student?.name ?? "?"} size="sm" />
              <div className="min-w-0 flex-1">
                <Link href={`/students/${entry.studentId}`} className="block truncate text-sm font-medium text-slate-900 hover:text-indigo-700">
                  {student?.name ?? "Unknown student"}
                </Link>
                <p className="text-xs text-slate-500">{entry.tests} tests</p>
              </div>
              <p className="text-sm font-semibold text-slate-900">{entry.average}%</p>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
