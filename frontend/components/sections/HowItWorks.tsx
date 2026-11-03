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
        <ol className="relative mt-12 grid gap-6 md:grid-cols-3">
          {/* Dashed line behind the cards: it shows in the gaps and joins the three steps */}
          <div
            aria-hidden="true"
            className="absolute left-[16%] right-[16%] top-11 hidden border-t-2 border-dashed border-accent/40 md:block"
          />
          {howItWorks.map((step, i) => (
            <li
              key={step.title}
              className="relative rounded-2xl border-2 border-accent/20 bg-white p-6 text-center transition duration-200 hover:-translate-y-1 hover:border-accent hover:shadow-lg"
            >
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-accent text-base font-bold text-white ring-4 ring-accent-soft">
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
