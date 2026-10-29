import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import QuestionView from "@/components/dashboard/QuestionView";
import { dashboardSubjects, moduleQuestions, subjectModules } from "@/data/dashboard";

type ModulePageProps = {
  params: Promise<{ subject: string; module: string }>;
};

function findModule(subjectSlug: string, moduleSlug: string) {
  const subject = dashboardSubjects.find((s) => s.slug === subjectSlug);
  const found = subjectModules[subjectSlug]?.find((m) => m.slug === moduleSlug);
  return subject && found ? { subject, module: found } : null;
}

// Build one page per module that exists
export function generateStaticParams() {
  return Object.entries(subjectModules).flatMap(([subject, modules]) =>
    modules.map((m) => ({ subject, module: m.slug })),
  );
}

export async function generateMetadata({ params }: ModulePageProps): Promise<Metadata> {
  const { subject, module } = await params;
  const found = findModule(subject, module);
  return {
    title: found ? `${found.module.title} | HN QBank` : "Module | HN QBank",
    robots: { index: false },
  };
}

export default async function ModulePage({ params }: ModulePageProps) {
  const { subject: subjectSlug, module: moduleSlug } = await params;
  const found = findModule(subjectSlug, moduleSlug);
  if (!found) notFound();

  const { subject, module } = found;
  const questions = moduleQuestions[`${subjectSlug}/${moduleSlug}`] ?? [];

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
            <Link href={`/dashboard/${subjectSlug}`} className="hover:underline">
              {subject.name}
            </Link>
          </li>
          <li aria-hidden="true">&gt;</li>
          <li>
            <Link href={`/dashboard/${subjectSlug}/modules`} className="hover:underline">
              modules
            </Link>
          </li>
          <li aria-hidden="true">&gt;</li>
          <li aria-current="page">{module.title}</li>
        </ol>
      </nav>

      <div className="mt-4 flex flex-1 flex-col">
        {questions.length > 0 ? (
          <QuestionView subjectName={subject.name} total={module.mcqs} questions={questions} />
        ) : (
          <>
            <h1 className="text-2xl font-bold">{subject.name}</h1>
            <p className="mt-5 rounded-xl bg-white p-6 text-sm text-slate-600">
              Questions for this module will be added soon.
            </p>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
