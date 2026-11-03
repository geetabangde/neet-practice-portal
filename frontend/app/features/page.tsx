import type { Metadata } from "next";
import PageFrame from "@/components/layout/PageFrame";
import FeaturesSection from "@/components/sections/FeaturesSection";
import PageCta from "@/components/sections/PageCta";
import StatsSection from "@/components/sections/StatsSection";

export const metadata: Metadata = {
  title: "Features | HN QBank",
  description: "The features that help you crack NEET PG: custom modules, navigator, videos and more.",
};

export default function FeaturesPage() {
  return (
    <PageFrame>
      <FeaturesSection asPage />
      <StatsSection />
      <PageCta
        title="Ready To See It"
        highlight="In Action?"
        text="Start a free trial and try the features on real modules."
      />
    </PageFrame>
  );
}
