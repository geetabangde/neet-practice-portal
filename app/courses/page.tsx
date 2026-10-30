import type { Metadata } from "next";
import PageFrame from "@/components/layout/PageFrame";
import CounsellingCta from "@/components/sections/CounsellingCta";
import CoursesSection from "@/components/sections/CoursesSection";
import FreeTrialSection from "@/components/sections/FreeTrialSection";

export const metadata: Metadata = {
  title: "Courses | HN QBank",
  description: "Compare the QBank, Test Series and complete plans for NEET PG and FMGE.",
};

export default function CoursesPage() {
  return (
    <PageFrame>
      <CoursesSection />
      <CounsellingCta />
      <FreeTrialSection />
    </PageFrame>
  );
}
