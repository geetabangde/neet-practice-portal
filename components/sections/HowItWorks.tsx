import SectionHeading from "@/components/ui/SectionHeading";
import { howItWorks } from "@/data/landing";

export default function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="bg-tint py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="how-heading"
          badge="How it works"
          title="From First Question To"
          highlight="Better Scores."
        />
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {howItWorks.map((step, i) => (
            <li
              key={step.title}
              className="rounded-2xl border-2 border-accent/20 bg-white p-6 transition-colors hover:border-accent"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-base font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 text-xl font-semibold text-black">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-700">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
