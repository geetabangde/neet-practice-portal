import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import { dashboardSubjects } from "@/data/dashboard";
import { stats } from "@/data/landing";

// Main content of the /subjects page: the same pastel cards as the dashboard,
// on a white background. The progress bars are sample numbers.
export default function SubjectsShowcase() {
  return (
    <section aria-labelledby="subjects-heading" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          as="h1"
          id="subjects-heading"
          badge="Subjects"
          title="Every Subject,"
          highlight="Tracked To The Module."
          subtitle="Your dashboard shows modules completed and percentage per subject, so gaps are obvious."
        />

        <ul className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <li
              key={s.label}
              className="rounded-xl border border-accent/20 bg-tint px-3 py-4 text-center"
            >
              <p className="text-2xl font-bold text-brand-950">{s.value}</p>
              <p className="mt-1 text-xs text-slate-500">{s.label}</p>
            </li>
          ))}
        </ul>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {dashboardSubjects.map((subject) => (
            <li
              key={subject.slug}
              className={`rounded-2xl border border-black/5 p-4 text-brand-950 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${subject.toneClass}`}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/70">
                <Image
                  src={`/subjects/${subject.icon}.png`}
                  alt=""
                  width={80}
                  height={80}
                  className="h-9 w-9 object-contain"
                />
              </span>
              <h2 className="mt-4 text-base font-semibold">{subject.name}</h2>
              <p className="text-xs text-black/70">
                {subject.completed}/{subject.total} modules
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div
                  role="progressbar"
                  aria-label={`${subject.name} progress`}
                  aria-valuenow={subject.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-1.5 flex-1 rounded-full bg-black/10"
                >
                  <div className="h-full rounded-full bg-accent" style={{ width: `${subject.percent}%` }} />
                </div>
                <span className="w-8 text-right text-xs font-semibold">{subject.percent}%</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
