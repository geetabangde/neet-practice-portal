import type { Metadata } from "next";
import PageFrame from "@/components/layout/PageFrame";
import FAQSection from "@/components/sections/FAQSection";
import PageCta from "@/components/sections/PageCta";

export const metadata: Metadata = {
  title: "FAQ | HN QBank",
  description: "Answers to common questions about HN QBank for NEET PG and FMGE.",
};

export default function FaqPage() {
  return (
    <PageFrame>
      <FAQSection asPage />
      <PageCta
        title="Still Have A Question?"
        highlight="Try It Free."
        text="The quickest way to find out if HN QBank suits you is to start a free trial."
      />
    </PageFrame>
  );
}
