"use client";

import { useState } from "react";
import PlanDetailDialog from "./PlanDetailDialog";
import type { Plan } from "@/types/dashboard";

export default function PlanCard({ plan }: { plan: Plan }) {
  const [months, setMonths] = useState<number | null>(plan.defaultMonths ?? null);
  const [detailOpen, setDetailOpen] = useState(false);

  const card = (
    <div className="flex h-full flex-col rounded-xl bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-2xl font-bold leading-none">{plan.name}</h2>
        <button
          suppressHydrationWarning
          type="button"
          onClick={() => setDetailOpen(true)}
          className="text-xs font-medium text-accent underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Learn More
        </button>
      </div>
      <span className="mt-2 w-fit rounded bg-black px-2 py-0.5 text-[10px] font-semibold text-white">
        {plan.audience}
      </span>
      <p className="mt-6 text-xs">{plan.includes}</p>

      <fieldset className="mt-5 space-y-3">
        <legend className="sr-only">{plan.name} duration</legend>
        {plan.options.map((option) => (
          <label key={option.months} className="flex cursor-pointer items-start gap-2 text-xs">
            <input
              suppressHydrationWarning
              type="radio"
              name={`plan-${plan.name}`}
              checked={months === option.months}
              onChange={() => setMonths(option.months)}
              className="mt-0.5 h-3.5 w-3.5 accent-accent"
            />
            <span className="flex flex-1 items-center gap-2">
              {option.months} Months
              {option.recommended ? (
                <span className="rounded bg-black px-1.5 py-0.5 text-[7px] font-semibold uppercase text-white">
                  Recommended
                </span>
              ) : null}
            </span>
            <span className="text-right leading-tight">
              <span className="block">₹ {option.price}</span>
              <span className="block text-[9px] text-slate-500 line-through">₹ {option.originalPrice}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <PlanDetailDialog plan={plan} open={detailOpen} onClose={() => setDetailOpen(false)} />

      <div className="mt-auto pt-8">
        <button
          suppressHydrationWarning
          type="button"
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-xs font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Buy Now
        </button>
      </div>
    </div>
  );

  if (plan.popular) {
    return (
      <div className="order-first flex flex-col rounded-2xl bg-accent p-1.5 pt-0 lg:order-none">
        <span className="mx-auto mb-2 mt-3 rounded bg-white px-4 py-1 text-xs font-semibold uppercase text-accent">
          Most popular
        </span>
        <div className="flex-1">{card}</div>
      </div>
    );
  }

  return <div className="rounded-2xl bg-[#d3f3f9] p-1.5 lg:mt-12">{card}</div>;
}
