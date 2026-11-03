"use client";

import { ArrowLeft, Award, Clock, Download, Hash, Target } from "lucide-react";
import Link from "next/link";
import { DonutChart } from "@/components/charts/donut-chart";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";
import { indexById, resultAccuracy, scoreTone } from "@/lib/selectors";

export function ResultDetail({ id }: { id: string }) {
  const { results, students, tests, subjects } = useAdminStore();
  const toast = useToast();

  const result = results.find((r) => r.id === id);

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
  const subjectById = indexById(subjects.items);
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

        <Card className="xl:col-span-2">
          <CardHeader title="Subject-wise breakdown" description="Correct, incorrect and unattempted questions in each subject" />
          <CardContent>
            <ul className="space-y-5">
              {result.subjectScores.map((score) => {
                const total = score.correct + score.incorrect + score.unattempted;
                const subjectAccuracy = resultAccuracy(score);
                return (
                  <li key={score.subjectId}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-800">{subjectById.get(score.subjectId)?.name ?? "Deleted subject"}</span>
                      <span className="flex items-center gap-2 text-slate-500">
                        {score.correct}/{total} correct
                        <Badge tone={scoreTone(subjectAccuracy)}>{subjectAccuracy}%</Badge>
                      </span>
                    </div>
                    <div
                      role="img"
                      aria-label={`${score.correct} correct, ${score.incorrect} incorrect, ${score.unattempted} unattempted`}
                      className="flex h-3 overflow-hidden rounded-full bg-slate-100"
                    >
                      <div className="bg-emerald-500" style={{ width: `${(score.correct / total) * 100}%` }} />
                      <div className="bg-red-400" style={{ width: `${(score.incorrect / total) * 100}%` }} />
                      <div className="bg-slate-300" style={{ width: `${(score.unattempted / total) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-600">
              <li className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" aria-hidden="true" /> Correct
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-red-400" aria-hidden="true" /> Incorrect
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-slate-300" aria-hidden="true" /> Unattempted
              </li>
            </ul>
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
                  <dd className="font-medium text-slate-900">{test.questionIds.length}</dd>
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
                  <dd className="font-medium text-slate-900">{test.negativeMarking > 0 ? `−${test.negativeMarking}` : "None"}</dd>
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
