import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import { subjects } from "@/data/landing";

export default function SubjectsSection() {
  return (
    <section
      id="subjects"
      aria-labelledby="subjects-heading"
      className="bg-brand-950 bg-[radial-gradient(ellipse_at_50%_55%,#0b4350_0%,#06303a_35%,#021419_85%)] py-16 sm:py-20"
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
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {subjects.map((s, i) => (
            <li key={i} className="rounded-lg bg-white p-3 shadow-lg">
              <div className="flex items-center gap-3">
                <Image
                  src={`/subjects/${s.icon}.png`}
                  alt=""
                  width={60}
                  height={60}
                  className="h-9 w-9 shrink-0 object-contain"
                />
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-black">{s.name}</h3>
                  <p className="text-[10px] text-slate-700">{s.modules} modules</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div
                  role="progressbar"
                  aria-label={`${s.name} progress`}
                  aria-valuenow={s.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-1.5 flex-1 rounded-full bg-slate-200"
                >
                  <div className="h-full rounded-full bg-accent" style={{ width: `${s.percent}%` }} />
                </div>
                <span className="w-8 text-right text-[10px] font-semibold text-black">{s.percent}%</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
