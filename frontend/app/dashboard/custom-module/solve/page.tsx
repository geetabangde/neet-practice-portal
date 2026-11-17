import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import CustomModuleSolve from "@/components/dashboard/CustomModuleSolve";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: "Custom Module | HN QBank",
  robots: { index: false },
};

type SolvePageProps = {
  searchParams: Promise<{ id?: string | string[] }>;
};

// Reads ?id= from the address (set by "Start Module"), so it sits inside Suspense
async function Solve({ searchParams }: SolvePageProps) {
  const { id } = await searchParams;
  const moduleId = Array.isArray(id) ? id[0] : id;

  if (!moduleId) {
    return (
      <p className="rounded-xl bg-white p-6 text-sm text-slate-600">
        No custom module was chosen.{" "}
        <Link href="/dashboard/custom-module" className="font-semibold text-accent-dark hover:underline">
          Create one
        </Link>
      </p>
    );
  }
  return <CustomModuleSolve id={moduleId} />;
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
