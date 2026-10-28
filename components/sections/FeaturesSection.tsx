import SectionHeading from "@/components/ui/SectionHeading";
import { CheckIcon, PlayIcon } from "@/components/ui/Icons";
import { features } from "@/data/landing";
import type { FeaturePreviewKind } from "@/types/landing";

// Small CSS mock-ups that stand in for the Figma illustrations
function FeaturePreview({ kind }: { kind: FeaturePreviewKind }) {
  switch (kind) {
    case "video":
      return (
        <div className="grid h-full place-items-center">
          <div className="w-4/5 rounded-lg bg-white p-3 shadow">
            <div className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-brand-950 text-white">
              <PlayIcon className="h-4 w-4" />
            </div>
            <div className="mt-3 h-1 rounded bg-slate-200">
              <div className="h-full w-1/3 rounded bg-accent" />
            </div>
            <p className="mt-1 text-center text-[9px] text-slate-500">Glycolysis: full solution</p>
          </div>
        </div>
      );
    case "navigator":
      return (
        <div className="grid h-full place-items-center">
          <div className="grid grid-cols-7 gap-1 rounded-lg bg-white p-3 shadow">
            {Array.from({ length: 21 }, (_, i) => (
              <span
                key={i}
                className={`grid h-4 w-4 place-items-center rounded text-[7px] ${
                  i % 5 === 0 ? "bg-rose-200" : i % 3 === 0 ? "bg-emerald-200" : "bg-slate-100"
                }`}
              >
                {i + 1}
              </span>
            ))}
          </div>
        </div>
      );
    case "score":
      return (
        <div className="grid h-full place-items-center">
          <div className="rounded-lg bg-white px-6 py-3 text-center shadow">
            <span className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white">
              <CheckIcon className="h-5 w-5" />
            </span>
            <p className="mt-1 text-[10px] font-semibold">Test Completed</p>
          </div>
        </div>
      );
    default:
      // custom, magic, bookmarks: a list of rows with a leading dot
      return (
        <div className="grid h-full place-items-center">
          <ul className="w-4/5 space-y-2 rounded-lg bg-white p-3 shadow">
            {[70, 90, 55, 80].map((w) => (
              <li key={w} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span className="h-1.5 rounded bg-slate-200" style={{ width: `${w}%` }} />
              </li>
            ))}
          </ul>
        </div>
      );
  }
}

export default function FeaturesSection() {
  return (
    <section id="features" aria-labelledby="features-heading" className="bg-slate-50 py-16 sm:py-24">
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
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-lg"
            >
              <div aria-hidden="true" className={`h-40 rounded-xl ${f.panelClass}`}>
                <FeaturePreview kind={f.preview} />
              </div>
              <span className="mt-4 inline-block rounded-full bg-accent-soft px-2.5 py-0.5 text-[10px] font-medium text-accent-dark">
                {f.tag}
              </span>
              <h3 className="mt-2 text-lg font-bold text-brand-950">{f.title}</h3>
              <p className="mt-1 text-xs text-slate-500">{f.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
