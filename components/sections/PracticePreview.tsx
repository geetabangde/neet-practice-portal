import ButtonLink from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/Icons";
import { practiceChecklist, sampleOptions } from "@/data/landing";

// Static mock of the question screen (decorative, so hidden from screen readers)
function QuestionMock() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 text-[10px] text-slate-500">
        <span>QBank Edition 6</span>
        <span>Question 4 of 20</span>
      </div>
      <div className="p-4 text-xs">
        <p className="font-semibold text-brand-950">
          Which of the following is false about glycolysis?
        </p>
        <div className="my-3 h-24 rounded-lg bg-linear-to-br from-rose-200 via-sky-100 to-indigo-200" />
        <ul className="space-y-2">
          {sampleOptions.map((opt) => (
            <li
              key={opt.text}
              className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent-soft/50 px-3 py-2 text-slate-600"
            >
              <span>{opt.text}</span>
              <span className="text-[10px] text-slate-400">{opt.percent}%</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between text-[10px]">
          <span className="rounded border border-slate-200 px-3 py-1 text-slate-500">Previous</span>
          <span className="rounded bg-accent px-3 py-1 text-white">Next</span>
        </div>
      </div>
    </div>
  );
}

export default function PracticePreview() {
  return (
    <section id="practice" aria-labelledby="practice-heading" className="bg-white py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <span className="text-xs font-medium text-accent-dark">Try it now</span>
          <h2
            id="practice-heading"
            className="mt-2 text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl"
          >
            Practice With The Exact{" "}
            <span className="text-accent">Platform You&apos;ll Use.</span>
          </h2>
          <p className="mt-4 max-w-md text-sm text-slate-500">
            Same timer, same navigator, same peer percentages. Answer the sample
            question and see how a test session feels.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-600">
            {practiceChecklist.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {item}
              </li>
            ))}
          </ul>
          <ButtonLink href="#trial" className="mt-8">
            Try a Free Module
          </ButtonLink>
        </div>
        <QuestionMock />
      </div>
    </section>
  );
}
