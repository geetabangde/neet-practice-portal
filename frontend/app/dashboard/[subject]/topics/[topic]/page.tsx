import type { Metadata } from "next";
import { Suspense } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import TopicPractice from "@/components/dashboard/TopicPractice";

export const metadata: Metadata = {
  title: "Practice | HN QBank",
  robots: { index: false },
};

type TopicPageProps = {
  params: Promise<{ subject: string; topic: string }>;
};

// Reads the address of the page, so it sits inside Suspense. The topics are not known ahead of time.
async function Practice({ params }: TopicPageProps) {
  const { subject, topic } = await params;
  return <TopicPractice slug={subject} topicId={topic} />;
}

export default function TopicPage({ params }: TopicPageProps) {
  return (
    <DashboardShell title="QBank Edition 8">
      <Suspense fallback={<p className="mt-5 rounded-xl bg-white p-6 text-sm text-slate-600">Loading...</p>}>
        <Practice params={params} />
      </Suspense>
    </DashboardShell>
  );
}
