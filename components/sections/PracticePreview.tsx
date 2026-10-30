import Image from "next/image";
import ButtonLink from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/Icons";
import { practiceChecklist } from "@/data/landing";

// asPage: this section is the main content of its own page, so its heading is the h1
export default function PracticePreview({ asPage = false }: { asPage?: boolean }) {
  const Heading = asPage ? "h1" : "h2";
  return (
    <section id="practice" aria-labelledby="practice-heading" className="bg-white py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <span className="inline-block rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-dark">
            Try it now
          </span>
          <Heading
            id="practice-heading"
            className="mt-4 text-3xl font-bold leading-tight tracking-tight text-black sm:text-4xl lg:text-[40px]"
          >
            Practice With The Exact{" "}
            <span className="text-accent">Platform You&apos;ll Use.</span>
          </Heading>
          <p className="mt-4 max-w-md text-sm text-slate-700">
            Same timer, same navigator, same peer percentages. Answer the sample
            question and see how a session feels.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-black">
            {practiceChecklist.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="grid h-4 w-4 shrink-0 place-items-center rounded bg-accent-soft text-accent-dark">
                  <CheckIcon className="h-3 w-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <ButtonLink href="#trial" className="mt-8 px-6 py-3">
            Try a Free Module
          </ButtonLink>
        </div>
        <Image
          src="/question-preview.png"
          alt="Sample question screen: Which of the following is false about glycolysis, with four options and the percentage of students who chose each"
          width={803}
          height={692}
          className="h-auto w-full rounded-2xl shadow-[0_8px_30px_rgba(11,37,48,0.12)]"
        />
      </div>
    </section>
  );
}
