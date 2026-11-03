import ButtonLink from "@/components/ui/Button";

type PageCtaProps = {
  title: string;
  highlight: string;
  text: string;
};

// Closing banner at the bottom of a page: one clear next step
export default function PageCta({ title, highlight, text }: PageCtaProps) {
  return (
    <section aria-labelledby="page-cta-heading" className="bg-white px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 rounded-3xl bg-brand-950 bg-[radial-gradient(ellipse_at_80%_20%,#0c4a58_0%,#07313b_45%,#04202a_90%)] px-6 py-10 text-center text-white sm:px-12 sm:py-14">
        <h2 id="page-cta-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
          {title} <span className="text-accent">{highlight}</span>
        </h2>
        <p className="max-w-xl text-sm text-white/70">{text}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href="/signup" className="px-6 py-3">
            Start Free Trial
          </ButtonLink>
          <ButtonLink href="/courses" variant="outline" className="px-6 py-3">
            See Courses
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
