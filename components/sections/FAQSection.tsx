"use client";

import { useId, useState } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
import { MinusIcon, PlusIcon } from "@/components/ui/Icons";
import { faqs } from "@/data/landing";

// asPage: this section is the main content of its own page, so its heading is the h1
export default function FAQSection({ asPage = false }: { asPage?: boolean }) {
  // Index of the open item, or null when all are closed (first one starts open)
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();

  return (
    <section id="faq" aria-labelledby="faq-heading" className="bg-tint py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeading
          as={asPage ? "h1" : "h2"}
          id="faq-heading"
          badge="Still deciding?"
          title="Everything You"
          highlight="Wanted To Ask."
        />
        <ul className="mt-12 space-y-3">
          {faqs.map((item, i) => {
            const isOpen = openIndex === i;
            const buttonId = `${baseId}-btn-${i}`;
            const panelId = `${baseId}-panel-${i}`;
            return (
              <li key={item.question} className="rounded-lg bg-white shadow-[0_2px_8px_rgba(11,37,48,0.08)]">
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
      </div>
    </section>
  );
}
