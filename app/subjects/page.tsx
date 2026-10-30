import type { Metadata } from "next";
import PageFrame from "@/components/layout/PageFrame";
import PageCta from "@/components/sections/PageCta";
import SubjectsSection from "@/components/sections/SubjectsSection";

export const metadata: Metadata = {
  title: "Subjects | HN QBank",
  description: "Every NEET PG subject, tracked to the module.",
};

export default function SubjectsPage() {
  return (
    <PageFrame>
      <SubjectsSection asPage />
      <PageCta
        title="Start With The Subject"
        highlight="You Fear Most."
        text="Open a free module in any subject and see where you stand."
      />
    </PageFrame>
  );
}
