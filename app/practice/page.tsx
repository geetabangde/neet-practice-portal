import type { Metadata } from "next";
import PageFrame from "@/components/layout/PageFrame";
import FreeTrialSection from "@/components/sections/FreeTrialSection";
import HowItWorks from "@/components/sections/HowItWorks";
import PracticePreview from "@/components/sections/PracticePreview";

export const metadata: Metadata = {
  title: "Practice | HN QBank",
  description: "Practice NEET PG MCQs on the same exam-style platform you will use.",
};

export default function PracticePage() {
  return (
    <PageFrame>
      <PracticePreview asPage />
      <HowItWorks />
      <FreeTrialSection />
    </PageFrame>
  );
}
