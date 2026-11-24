"use client";

import { ArrowLeft, Award, Clock, Download, Hash, Target } from "lucide-react";
import Link from "next/link";
import { DonutChart } from "@/components/charts/donut-chart";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Avatar } from "@/components/ui/avatar";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";
import { resultAccuracy, scoreTone } from "@/lib/selectors";

export function ResultDetail({ id }: { id: string }) {
  const { results, tests, students, contentStatus, reloadContent } = useAdminStore();
  const toast = useToast();

  const result = results.find((r) => r.id === id);

  if (!result && contentStatus === "loading") {
    return (
      <p role="status" className="rounded-lg bg-white px-4 py-3 text-sm text-slate-600">
        Loading the result...
      </p>
    );
  }

  if (!result && contentStatus === "error") {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        Could not load the result from the server.
        <Button size="sm" variant="outline" onClick={reloadContent}>
          Try again
        </Button>
      </div>
    );
  }

  if (!result) {
    return (
      <Card>
        <EmptyState
          icon={Award}
          title="Result not found"
          description="This result does not exist."
          action={
            <Link href="/results" className={buttonStyles()}>
              Back to results
            </Link>
          }
        />
      </Card>
    );
  }

  const student = students.items.find((s) => s.id === result.studentId);
  const test = tests.items.find((t) => t.id === result.testId);
  const accuracy = resultAccuracy(result);
  const totalQuestions = result.correct + result.incorrect + result.unattempted;
  const negative = test?.negativeMarking ?? 0;
  const perQuestion = test?.marksPerQuestion ?? 0;

  return (
    <>
      <Link href="/results" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to results
      </Link>
      <PageHeader
        title={test?.title ?? "Deleted test"}
        description={`Attempted by ${student?.name ?? "a deleted student"} on ${formatDate(result.completedAt)}`}
        actions={
          <Button
            variant="outline"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => toast({ title: "Report download started", description: "Demo only: no file is created yet." })}
          >
            Download report
          </Button>
        }
      />

      <section aria-label="Result summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Marks obtained" value={`${result.marksObtained} / ${result.totalMarks}`} icon={Award} tone="indigo" />
        <StatCard label="Accuracy" value={`${accuracy}%`} icon={Target} tone={scoreTone(accuracy) === "green" ? "emerald" : scoreTone(accuracy) === "amber" ? "amber" : "rose"} />
        <StatCard label="Rank" value={`#${result.rank}`} icon={Hash} tone="violet" />
        <StatCard
          label="Time taken"
          value={`${result.timeTakenMinutes} min`}
          icon={Clock}
          tone="blue"
        />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Answer breakdown" description={`${totalQuestions} questions`} />
          <CardContent>
            <DonutChart
              title="Answer breakdown"
              centerValue={`${accuracy}%`}
              centerLabel="accuracy"
              data={[
                { label: "Correct", value: result.correct },
                { label: "Incorrect", value: result.incorrect },
                { label: "Unattempted", value: result.unattempted },
              ]}
            />
            <dl className="mt-6 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Correct × {perQuestion}</dt>
                <dd className="font-medium text-emerald-600">+{result.correct * perQuestion}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Incorrect × {negative}</dt>
                <dd className="font-medium text-red-600">−{result.incorrect * negative}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2">
                <dt className="font-medium text-slate-700">Total</dt>
                <dd className="font-semibold text-slate-900">{result.marksObtained}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Student" />
          <CardContent>
            {student ? (
              <div className="flex items-center gap-4">
                <Avatar name={student.name} size="lg" />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{student.name}</p>
                  <p className="truncate text-sm text-slate-500">{student.email}</p>
                  <Link href={`/students/${student.id}`} className="mt-1 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">
                    View student profile
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">This student was deleted.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Test details" />
          <CardContent>
            {test ? (
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-slate-500">Questions</dt>
                  <dd className="font-medium text-slate-900">{test.questionCount}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Duration</dt>
                  <dd className="font-medium text-slate-900">{test.durationMinutes} min</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Marks per question</dt>
                  <dd className="font-medium text-slate-900">{test.marksPerQuestion}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Negative marking</dt>
                  <dd className="font-medium text-slate-900">{`${test.negativeRatio} of the marks (−${test.negativeMarking})`}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-slate-500">This test was deleted.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
