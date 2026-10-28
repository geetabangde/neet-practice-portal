import ButtonLink from "@/components/ui/Button";
import { tickerItems } from "@/data/landing";

// Decorative dashboard preview (hidden from screen readers)
function DashboardCards() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-3 text-brand-950 lg:max-w-none"
    >
      <div className="col-span-2 rounded-2xl bg-white p-4 shadow-xl sm:col-span-1 sm:col-start-2">
        <p className="text-xs text-slate-500">Streak</p>
        <p className="text-2xl font-bold">11 days</p>
        <p className="text-xs font-medium text-emerald-600">+142 MCQs</p>
      </div>

      <div className="col-span-2 rounded-2xl bg-white p-4 shadow-xl sm:col-span-1 sm:row-span-2 sm:row-start-1">
        <p className="text-xs text-slate-500">QBank progress</p>
        <p className="text-2xl font-bold">
          829 <span className="text-sm font-normal text-slate-400">/ 835</span>
        </p>
        <div className="mt-2 h-1.5 rounded-full bg-slate-100">
          <div className="h-full w-[99%] rounded-full bg-accent" />
        </div>
        <p className="mt-2 text-xs font-medium text-emerald-600">
          1 modules completed
        </p>
      </div>

      <div className="col-span-2 rounded-2xl bg-white p-4 shadow-xl sm:col-span-1">
        <p className="text-xs text-slate-500">Weak chapters</p>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-medium">
          <span className="rounded bg-rose-100 px-2 py-0.5 text-rose-600">GLYCOLYSIS</span>
          <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-600">KREBS CYCLE</span>
          <span className="rounded bg-sky-100 px-2 py-0.5 text-sky-600">HMP SHUNT</span>
        </div>
      </div>

      <div className="col-span-2 rounded-2xl bg-white p-4 shadow-xl sm:col-span-1">
        <p className="text-xs text-slate-500">Next test</p>
        <p className="text-lg font-bold leading-snug">Full syllabus Grand Test</p>
        <p className="mt-1 text-xs text-slate-500">Sun, 10:00 AM · 3h 30m</p>
      </div>

      <div className="col-span-2 rounded-2xl bg-white p-4 shadow-xl sm:col-span-1 sm:col-start-2">
        <p className="text-xs text-slate-500">Revision queue</p>
        <p className="text-2xl font-bold">24</p>
      </div>
    </div>
  );
}

export default function HeroSection() {
  // The list is rendered twice so the CSS animation can loop seamlessly
  const loop = [...tickerItems, ...tickerItems];

  return (
    <section
      id="top"
      aria-labelledby="hero-heading"
      className="bg-linear-to-br from-brand-950 via-brand-900 to-brand-800 text-white"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-24">
        <div>
          <span className="inline-block rounded-full bg-accent/15 px-3 py-1 text-xs text-accent">
            NEET PG and FMGE admissions open
          </span>
          <h1
            id="hero-heading"
            className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
          >
            MCQ Practice And Testing For Serious{" "}
            <span className="text-accent">NEET PG Aspirants.</span>
          </h1>
          <p className="mt-5 max-w-lg text-sm text-white/70">
            Practice the right questions, take exam-style tests, find your weak
            areas and fix them with a clear preparation system.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href="#trial">Start Practicing Free</ButtonLink>
            <ButtonLink href="#features" variant="outline">
              View Courses
            </ButtonLink>
          </div>
          <p className="mt-6 text-xs text-white/60">
            Thousands of aspirants are practicing right now.
          </p>
        </div>

        <DashboardCards />
      </div>

      <div className="overflow-hidden border-t border-white/10 bg-brand-950 py-3">
        <ul className="flex w-max animate-[ticker_30s_linear_infinite] gap-10 whitespace-nowrap text-xs text-white/80 motion-reduce:animate-none">
          {loop.map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
