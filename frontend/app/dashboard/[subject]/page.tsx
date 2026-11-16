import type { Metadata } from "next";
import DashboardShell from "@/components/dashboard/DashboardShell";
import SubjectTopics from "@/components/dashboard/SubjectTopics";
import { dashboardSubjects } from "@/data/dashboard";

type SubjectPageProps = {
  params: Promise<{ subject: string }>;
};

// Pages for the subjects that were designed are built ahead of time. Any other subject the admin adds
// is opened on demand. Either way the subject and its topics come from the server (see SubjectTopics).
export function generateStaticParams() {
  return dashboardSubjects.map((s) => ({ subject: s.slug }));
}

export async function generateMetadata({ params }: SubjectPageProps): Promise<Metadata> {
  const { subject: slug } = await params;
  const designed = dashboardSubjects.find((s) => s.slug === slug);
  return {
    title: designed ? `${designed.name} | HN QBank` : "Subject | HN QBank",
    robots: { index: false },
  };
}

export default async function SubjectPage({ params }: SubjectPageProps) {
  const { subject: slug } = await params;

  return (
    <DashboardShell title="QBank Edition 8">
      <SubjectTopics slug={slug} />
    </DashboardShell>
  );
}
