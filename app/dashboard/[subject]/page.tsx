import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import TopicCard from "@/components/dashboard/TopicCard";
import { dashboardSubjects, subjectTopics } from "@/data/dashboard";

type SubjectPageProps = {
  params: Promise<{ subject: string }>;
};

function findSubject(slug: string) {
  return dashboardSubjects.find((s) => s.slug === slug);
}

// Build one page per subject ahead of time
export function generateStaticParams() {
  return dashboardSubjects.map((s) => ({ subject: s.slug }));
}

export async function generateMetadata({ params }: SubjectPageProps): Promise<Metadata> {
  const { subject: slug } = await params;
  const subject = findSubject(slug);
  return {
    title: subject ? `${subject.name} | HN QBank` : "Subject | HN QBank",
    robots: { index: false },
  };
}

export default async function SubjectPage({ params }: SubjectPageProps) {
  const { subject: slug } = await params;
  const subject = findSubject(slug);
  if (!subject) notFound();

  const topics = subjectTopics[slug] ?? [];

  return (
    <DashboardShell title="QBank Edition 8">
      <nav aria-label="Breadcrumb" className="text-xs">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/dashboard" className="text-accent-dark hover:underline">
              QBank
            </Link>
          </li>
          <li aria-hidden="true">&gt;</li>
          <li aria-current="page">{subject.name}</li>
        </ol>
      </nav>

      <h1 className="mt-4 text-2xl font-bold">{subject.name}</h1>
      <h2 className="mt-1 text-xs font-semibold uppercase">Topics</h2>

      {topics.length > 0 ? (
        <ul className="mt-5 grid gap-4 md:grid-cols-2">
          {topics.map((topic) => (
            <TopicCard key={topic.name} topic={topic} href={`/dashboard/${slug}/modules`} />
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-xl bg-white p-6 text-sm text-slate-600">
          Topics for {subject.name} will be added soon.
        </p>
      )}
    </DashboardShell>
  );
}
