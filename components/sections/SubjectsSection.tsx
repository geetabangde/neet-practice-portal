import SectionHeading from "@/components/ui/SectionHeading";
import { subjects } from "@/data/landing";

export default function SubjectsSection() {
  return (
    <section
      id="subjects"
      aria-labelledby="subjects-heading"
      className="bg-linear-to-b from-brand-950 to-brand-900 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="subjects-heading"
          dark
          badge="Subjects"
          title="Every Subject,"
          highlight="Tracked To The Module."
          subtitle="Your dashboard shows modules completed and percentage per subject, so gaps are obvious."
        />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {subjects.map((s) => {
            const percent = Math.round((s.modulesDone / s.modulesTotal) * 100);
            return (
              <li key={s.name} className="rounded-xl bg-white p-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-sm font-bold text-accent-dark"
                  >
                    {s.name[0]}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-brand-950">{s.name}</h3>
                    <p className="text-[10px] text-slate-500">
                      {s.modulesDone}/{s.modulesTotal} modules
                    </p>
                  </div>
                </div>
                <div
                  role="progressbar"
                  aria-label={`${s.name} progress`}
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="mt-3 h-1.5 rounded-full bg-slate-100"
                >
                  <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
                </div>
                <p className="mt-1 text-right text-[10px] text-slate-500">{percent}%</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
