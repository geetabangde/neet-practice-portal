"use client";

import { useId, useState } from "react";
import ButtonLink from "@/components/ui/Button";
import { MinusIcon, PlusIcon } from "@/components/ui/Icons";
import SectionHeading from "@/components/ui/SectionHeading";
import { faqs } from "@/data/landing";

// asPage: this is the main content of the /faq page. It becomes two columns:
// a dark card with the page title on the left, the questions on the right.
export default function FAQSection({ asPage = false }: { asPage?: boolean }) {
  // Index of the open item, or null when all are closed (first one starts open)
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();

  const questions = (
    <ul className={asPage ? "space-y-3" : "mt-12 space-y-3"}>
      {faqs.map((item, i) => {
        const isOpen = openIndex === i;
        const buttonId = `${baseId}-btn-${i}`;
        const panelId = `${baseId}-panel-${i}`;
        return (
          <li
            key={item.question}
            className={`rounded-lg bg-white shadow-[0_2px_8px_rgba(11,37,48,0.08)] ${
              asPage && isOpen ? "ring-2 ring-accent/40" : ""
            }`}
          >
            <h3>
              <button
                suppressHydrationWarning
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 rounded-lg px-4 py-3.5 text-left text-sm font-semibold text-black focus-visible:outline-2 focus-visible:outline-accent"
              >
                {item.question}
                {isOpen ? (
                  <MinusIcon className="h-4 w-4 shrink-0 text-accent" />
                ) : (
                  <PlusIcon className="h-4 w-4 shrink-0 text-accent" />
                )}
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="px-4 pb-3.5 text-xs text-slate-700"
            >
              {item.answer}
            </div>
          </li>
        );
      })}
    </ul>
  );

  if (asPage) {
    return (
      <section
        id="faq"
        aria-labelledby="faq-heading"
        className="bg-tint px-4 py-12 sm:px-6 sm:py-20"
      >
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
          <div className="relative overflow-hidden rounded-3xl bg-brand-950 bg-[radial-gradient(ellipse_at_30%_0%,#0c4a58_0%,#07313b_50%,#04202a_95%)] p-8 text-white sm:p-10 lg:sticky lg:top-24">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-accent/25 blur-3xl"
            />
            <div className="relative">
              <span className="inline-block rounded-full bg-accent/20 px-3 py-1 text-sm font-medium">
                Still deciding?
              </span>
              <h1 id="faq-heading" className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                Everything You <span className="text-accent">Wanted To Ask.</span>
              </h1>
              <p className="mt-4 text-sm text-white/70">
                Quick answers about plans, modules, tests and how the platform works.
              </p>
              <ButtonLink href="/signup" className="mt-8 px-6 py-3">
                Start Free Trial
              </ButtonLink>
            </div>
          </div>
          {questions}
        </div>
      </section>
    );
  }

  return (
    <section id="faq" aria-labelledby="faq-heading" className="bg-tint py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeading
          id="faq-heading"
          badge="Still deciding?"
          title="Everything You"
          highlight="Wanted To Ask."
        />
        {questions}
      </div>
    </section>
  );
}
