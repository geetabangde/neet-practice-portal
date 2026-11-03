import Image from "next/image";
import ButtonLink from "@/components/ui/Button";
import { tickerItems } from "@/data/landing";

const cardBase =
  "absolute rounded-xl border border-accent/70 bg-white p-3.5 text-brand-950 shadow-[0_0_22px_rgba(12,193,224,0.5)]";

// Decorative dashboard preview (hidden from screen readers).
// Cards are absolutely positioned so they overlap like in the Figma design;
// `zoom` shrinks the whole group on small screens without breaking the layout.
function DashboardCards() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto h-[376px] w-[410px] shrink-0 [zoom:0.68] min-[420px]:[zoom:0.85] sm:[zoom:1]"
    >
      <div className={`${cardBase} left-[176px] top-0 z-10 h-[88px] w-[146px]`}>
        <p className="text-xs">Streak</p>
        <p className="text-xl font-bold">11 days</p>
        <p className="text-[10px] font-medium text-emerald-500">+142 MCQs</p>
      </div>

      <div className={`${cardBase} left-0 top-[52px] h-[119px] w-[233px]`}>
        <p className="text-xs">QBank progress</p>
        <p className="mt-1 text-2xl font-bold">
          829 <span className="text-sm font-semibold text-slate-400">/ 835</span>
        </p>
        <p className="mt-1 text-[10px] font-medium text-emerald-500">1 modules completed</p>
        <div className="mt-1 h-1 rounded-full bg-slate-200">
          <div className="h-full w-[85%] rounded-full bg-accent" />
        </div>
      </div>

      <div className={`${cardBase} left-[240px] top-[96px] h-[86px] w-[170px]`}>
        <p className="text-xs">Weak chapters</p>
        <div className="mt-2 flex flex-wrap gap-1 text-[7px] font-semibold">
          <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-accent-dark">GLYCOLYSIS</span>
          <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-accent-dark">KREBS CYCLE</span>
          <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-accent-dark">HMP SHUNT</span>
        </div>
      </div>

      <div className={`${cardBase} left-0 top-[185px] h-[92px] w-[254px]`}>
        <Image
          src="/test-paper.png"
          alt=""
          width={111}
          height={115}
          className="absolute -top-8 right-1 h-auto w-16"
        />
        <p className="text-xs">Next test</p>
        <p className="mt-1 text-base font-bold leading-tight">Full syllabus Grand Test</p>
        <p className="mt-1 text-[10px] text-black/80">Sun, 10:00 AM · 3h 30m</p>
      </div>

      <div className={`${cardBase} left-[202px] top-[260px] z-10 h-[114px] w-[180px]`}>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-white">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 3h7l3 3v11H5zM8 9h4M8 12h4" />
          </svg>
        </span>
        <p className="mt-2 text-xs">Revision queue</p>
        <p className="text-2xl font-bold">24</p>
      </div>
    </div>
  );
}

// Image 1 is reused as the 4th avatar, matching the Figma design
const avatars = [
  "/avatars/avatar-1.png",
  "/avatars/avatar-2.png",
  "/avatars/avatar-3.png",
  "/avatars/avatar-4.png",
];

export default function HeroSection() {
  // The list is rendered twice so the CSS animation can loop seamlessly
  const loop = [...tickerItems, ...tickerItems];

  return (
    <section
      id="top"
      aria-labelledby="hero-heading"
      className="bg-brand-950 bg-[radial-gradient(ellipse_at_65%_65%,#0c4a58_0%,#07313b_40%,#04202a_85%)] text-white"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-12 px-4 py-14 sm:px-6 lg:flex-row lg:py-20">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            NEET PG and FMGE admissions open
          </span>
          <h1
            id="hero-heading"
            className="mt-6 text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl lg:text-[48px]"
          >
            MCQ Practice And Testing For Serious{" "}
            <span className="text-accent">NEET PG Aspirants.</span>
          </h1>
          <p className="mt-6 max-w-lg text-sm text-white/80 sm:text-base">
            Practice the right questions, take exam-style tests, find your weak
            areas and fix them with a clear preparation system.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="#trial">Start Practicing Free</ButtonLink>
            <ButtonLink href="#features" variant="outline">
              View Courses
            </ButtonLink>
          </div>
          <div className="mt-8 flex items-center gap-3">
            <ul aria-hidden="true" className="flex -space-x-3">
              {avatars.map((src) => (
                <li key={src}>
                  <Image src={src} alt="" width={49} height={49} className="h-9 w-9 rounded-full" />
                </li>
              ))}
            </ul>
            <p className="text-xs text-white/80 sm:text-sm">
              <strong className="font-semibold text-white">Thousands of aspirants</strong> are
              practicing right now.
            </p>
          </div>
        </div>

        <DashboardCards />
      </div>

      <div className="overflow-hidden border-b border-slate-200 bg-white py-4">
        <ul className="flex w-max animate-[ticker_30s_linear_infinite] gap-14 whitespace-nowrap text-sm font-medium text-brand-950 motion-reduce:animate-none">
          {loop.map((item, i) => (
            <li key={i} className="flex items-center gap-3">
              <span aria-hidden="true" className="h-2 w-2 rounded-[2px] bg-accent" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
