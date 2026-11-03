import type { Metadata } from "next";
import PageFrame from "@/components/layout/PageFrame";
import FAQSection from "@/components/sections/FAQSection";

export const metadata: Metadata = {
  title: "FAQ | HN QBank",
  description: "Answers to common questions about HN QBank for NEET PG and FMGE.",
};

export default function FaqPage() {
  return (
    <PageFrame>
      <FAQSection asPage />
    </PageFrame>
  );
}
