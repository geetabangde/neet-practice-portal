"use client";

import Link from "next/link";
import { useState } from "react";
import PlanDetailDialog from "./PlanDetailDialog";
import type { Plan } from "@/types/dashboard";

type PlanCardProps = {
  plan: Plan;
  // The card the student clicked: shown highlighted
  selected?: boolean;
  // The plan the student already has and that has not run out
  current?: boolean;
  onSelect?: () => void;
};

export default function PlanCard({ plan, selected = false, current = false, onSelect }: PlanCardProps) {
  const [months, setMonths] = useState<number | null>(plan.defaultMonths ?? null);
  const [detailOpen, setDetailOpen] = useState(false);

  const card = (
    <div className="flex h-full flex-col rounded-xl bg-white p-4">
      {current ? (
        <span className="mb-2 w-fit rounded bg-green-600 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">✓ Active plan</span>
      ) : null}
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
              onChange={() => {
                setMonths(option.months);
                onSelect?.();
              }}
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
        <Link
          href={`/dashboard/plans/checkout?plan=${encodeURIComponent(plan.name)}&months=${months ?? plan.options[0].months}`}
          className="block w-full rounded-lg bg-accent px-4 py-2.5 text-center text-xs font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {current ? "Extend plan" : "Buy Now"}
        </Link>
      </div>
    </div>
  );

  // Lifts on hover. The clicked card is lifted, ringed and turns the strong colour, so it is clear which plan is chosen.
  const frame = `cursor-pointer transition duration-200 hover:-translate-y-1 hover:shadow-xl ${
    selected ? "-translate-y-1 shadow-xl ring-2 ring-brand-950 ring-offset-2" : ""
  } ${current ? "outline outline-2 outline-offset-4 outline-green-600" : ""}`;

  if (plan.popular) {
    return (
      <div onClick={onSelect} className={`order-first flex flex-col rounded-2xl bg-accent p-1.5 pt-0 lg:order-none ${frame}`}>
        <span className="mx-auto mb-2 mt-3 rounded bg-white px-4 py-1 text-xs font-semibold uppercase text-accent">
          Most popular
        </span>
        <div className="flex-1">{card}</div>
      </div>
    );
  }

  return (
    <div onClick={onSelect} className={`rounded-2xl p-1.5 lg:mt-12 ${selected ? "bg-accent" : "bg-[#d3f3f9] hover:bg-[#bdeef7]"} ${frame}`}>
      {card}
    </div>
  );
}
