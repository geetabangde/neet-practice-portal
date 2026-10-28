import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import { features } from "@/data/landing";

export default function FeaturesSection() {
  return (
    <section id="features" aria-labelledby="features-heading" className="bg-tint py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="features-heading"
          badge="Features"
          title="Top Features That"
          highlight="Help You Crack NEET PG."
        />
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <li
              key={f.title}
              className="rounded-2xl border-2 border-accent/20 bg-white p-4 transition-colors hover:border-accent"
            >
              <Image
                src={f.image}
                alt={f.imageAlt}
                width={526}
                height={356}
                className="h-auto w-full rounded-2xl"
              />
              <span
                className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${f.tagClass}`}
              >
                <Image src={f.icon} alt="" width={14} height={14} className="h-3.5 w-auto" />
                {f.tag}
              </span>
              <h3 className="mt-3 text-xl font-semibold text-black">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-700">{f.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
