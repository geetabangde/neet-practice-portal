import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ModuleList from "@/components/dashboard/ModuleList";
import { dashboardSubjects, subjectModules } from "@/data/dashboard";

type ModulesPageProps = {
  params: Promise<{ subject: string }>;
};

function findSubject(slug: string) {
  return dashboardSubjects.find((s) => s.slug === slug);
}

export function generateStaticParams() {
  return dashboardSubjects.map((s) => ({ subject: s.slug }));
}

export async function generateMetadata({ params }: ModulesPageProps): Promise<Metadata> {
  const { subject: slug } = await params;
  const subject = findSubject(slug);
  return {
    title: subject ? `${subject.name} modules | HN QBank` : "Modules | HN QBank",
    robots: { index: false },
  };
}

export default async function ModulesPage({ params }: ModulesPageProps) {
  const { subject: slug } = await params;
  const subject = findSubject(slug);
  if (!subject) notFound();

  const modules = subjectModules[slug] ?? [];

  return (
    <DashboardShell title="QBank Edition 8">
      <nav aria-label="Breadcrumb" className="text-xs">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/dashboard" className="text-accent-dark hover:underline">
              QBank
            </Link>
          </li>
          <li aria-hidden="true">&gt;</li>
          <li>
            <Link href={`/dashboard/${slug}`} className="hover:underline">
              {subject.name}
            </Link>
          </li>
          <li aria-hidden="true">&gt;</li>
          <li aria-current="page">modules</li>
        </ol>
      </nav>

      <div className="relative">
        <h1 className="mt-4 text-2xl font-bold">{subject.name}</h1>
        <h2 className="mt-1 text-xs font-semibold uppercase">Modules</h2>
        {modules.length > 0 ? (
          <div className="mt-4 sm:mt-0">
            <ModuleList subject={slug} modules={modules} />
          </div>
        ) : (
          <p className="mt-5 rounded-xl bg-white p-6 text-sm text-slate-600">
            Modules for {subject.name} will be added soon.
          </p>
        )}
      </div>
    </DashboardShell>
  );
}
