import SectionHeading from "@/components/ui/SectionHeading";
import { stats } from "@/data/landing";

export default function StatsSection() {
  return (
    <section aria-labelledby="stats-heading" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="stats-heading"
          badge="Why aspirants trust us"
          title="Built For Serious Aspirants,"
          highlight="Proven By Numbers."
        />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <li key={s.label} className="rounded-xl border border-accent/20 bg-white p-5 shadow-sm">
              <p className="text-3xl font-bold text-brand-950">{s.value}</p>
              <p className="mt-1 text-xs text-slate-500">{s.label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
