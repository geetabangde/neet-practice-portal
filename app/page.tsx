import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import CounsellingCta from "@/components/sections/CounsellingCta";
import FAQSection from "@/components/sections/FAQSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import FreeTrialSection from "@/components/sections/FreeTrialSection";
import HeroSection from "@/components/sections/HeroSection";
import PracticePreview from "@/components/sections/PracticePreview";
import StatsSection from "@/components/sections/StatsSection";
import SubjectsSection from "@/components/sections/SubjectsSection";

// Server Component: it only arranges the sections in order
export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <PracticePreview />
        <FeaturesSection />
        <SubjectsSection />
        <StatsSection />
        <FreeTrialSection />
        <CounsellingCta />
        <FAQSection />
      </main>
      <Footer />
    </>
  );
}
