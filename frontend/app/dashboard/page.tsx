import type { Metadata } from "next";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ModulesCompleted from "@/components/dashboard/ModulesCompleted";
import PromoCard from "@/components/dashboard/PromoCard";
import SubjectCard from "@/components/dashboard/SubjectCard";
import {
  customModulePromo,
  dashboardSubjects,
  modulesSummary,
  revisionPromo,
} from "@/data/dashboard";

export const metadata: Metadata = {
  title: "Dashboard | HN QBank",
  description: "Your subject-wise progress in HN QBank.",
  // Personal page: keep it out of search results
  robots: { index: false },
};

export default function DashboardPage() {
  return (
    <DashboardShell title="QBank Edition 8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        {/* On small screens the summary comes first, then the subjects */}
        <aside aria-label="Summary" className="space-y-4 lg:order-2">
          <ModulesCompleted completed={modulesSummary.completed} total={modulesSummary.total} />
          <PromoCard promo={customModulePromo} variant="dark" />
          <PromoCard promo={revisionPromo} variant="accent" />
        </aside>

        <section aria-labelledby="subjects-heading" className="lg:order-1">
          <h1 id="subjects-heading" className="text-2xl font-bold">
            Subjects
          </h1>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {dashboardSubjects.map((subject) => (
              <SubjectCard key={subject.name} subject={subject} />
            ))}
          </ul>
        </section>
      </div>
    </DashboardShell>
  );
}
