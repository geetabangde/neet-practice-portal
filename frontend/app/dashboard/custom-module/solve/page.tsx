import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import QuestionView from "@/components/dashboard/QuestionView";
import { customModuleQuestions } from "@/data/dashboard";

export const metadata: Metadata = {
  title: "Custom Module | HN QBank",
  robots: { index: false },
};

type SolvePageProps = {
  searchParams: Promise<{ count?: string | string[] }>;
};

// Reads ?count= from the URL (set by "Start Module"), so it sits inside Suspense
async function Solve({ searchParams }: SolvePageProps) {
  const { count } = await searchParams;
  const parsed = Number(Array.isArray(count) ? count[0] : count);
  const total = Number.isInteger(parsed) && parsed >= 1 ? Math.min(parsed, 200) : 20;

  return <QuestionView subjectName="Custom Module" total={total} questions={customModuleQuestions} />;
}

export default function CustomModuleSolvePage({ searchParams }: SolvePageProps) {
  return (
    <DashboardShell title="QBank Edition 8">
      <nav aria-label="Breadcrumb" className="text-xs">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/dashboard/custom-module" className="text-accent-dark hover:underline">
              Create Module
            </Link>
          </li>
          <li aria-hidden="true">&gt;</li>
          <li aria-current="page">Solve</li>
        </ol>
      </nav>

      <div className="mt-4 flex flex-1 flex-col">
        <Suspense fallback={null}>
          <Solve searchParams={searchParams} />
        </Suspense>
      </div>
    </DashboardShell>
  );
}
