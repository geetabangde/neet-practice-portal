import ButtonLink from "@/components/ui/Button";

export default function CounsellingCta() {
  return (
    <section id="courses" aria-labelledby="counselling-heading" className="bg-white px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 rounded-3xl border border-accent/20 bg-tint p-8 sm:px-10 sm:py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 id="counselling-heading" className="text-2xl font-bold tracking-tight text-black sm:text-3xl">
            Not Sure Which Plan Fits?{" "}
            <span className="text-accent">Talk To An Expert.</span>
          </h2>
          <p className="mt-3 text-xs text-slate-800 sm:text-sm">
            Book a free counselling session and we&apos;ll help you pick the right plan.
          </p>
        </div>
        <ButtonLink href="#trial" className="shrink-0 self-start text-xs md:self-auto">
          Book a Free Session
        </ButtonLink>
      </div>
    </section>
  );
}
