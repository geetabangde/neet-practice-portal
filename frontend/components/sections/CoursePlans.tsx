"use client";

import { useId, useState } from "react";
import PlanDetailDialog from "@/components/dashboard/PlanDetailDialog";
import type { Plan } from "@/types/dashboard";

// Header colour of each plan card matching the Marrow reference palette
const headerTone: Record<string, string> = {
  "Plan C": "bg-[#e8eaf6]", // soft lavender / periwinkle
  "Plan B": "bg-[#ddf0e8]", // soft mint / sage green
  "Plan A": "bg-[#fcf8d8]", // soft pale yellow / butter cream
};

// Left to right on desktop; the popular plan comes first on phones
const planOrder = ["Plan C", "Plan B", "Plan A"];

function CouponAndReferral() {
  const [coupon, setCoupon] = useState("CLINICALEDGE");
  const [editingCoupon, setEditingCoupon] = useState(false);
  const [tempCoupon, setTempCoupon] = useState("CLINICALEDGE");

  const [referralOpen, setReferralOpen] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralApplied, setReferralApplied] = useState(false);

  const referralInputId = useId();
  const couponInputId = useId();

  return (
    <div className="mt-6 text-center">
      {/* Coupon banner */}
      <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-medium text-slate-700 shadow-md sm:text-sm">
        <span>Coupon code</span>
        {editingCoupon ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (tempCoupon.trim()) {
                setCoupon(tempCoupon.trim().toUpperCase());
              }
              setEditingCoupon(false);
            }}
            className="inline-flex items-center gap-1.5"
          >
            <label htmlFor={couponInputId} className="sr-only">
              Edit coupon code
            </label>
            <input
              id={couponInputId}
              type="text"
              value={tempCoupon}
              onChange={(e) => setTempCoupon(e.target.value)}
              className="w-28 rounded bg-slate-100 px-2 py-0.5 text-xs font-bold uppercase text-slate-900 outline-none ring-1 ring-accent"
              autoFocus
            />
            <button
              type="submit"
              className="rounded bg-accent px-2 py-0.5 text-xs font-semibold text-white hover:bg-accent-dark"
            >
              OK
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setEditingCoupon(true)}
            title="Click to edit coupon code"
            className="group inline-flex items-center gap-1.5 rounded bg-[#70b236] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#63a02f]"
          >
            <span>{coupon}</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3 text-white/90 transition-transform group-hover:scale-110"
              aria-hidden="true"
            >
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </button>
        )}
        <span className="text-slate-500">applied to all</span>
      </div>

      {/* Referral link */}
      <div className="mt-4">
        <button
          suppressHydrationWarning
          type="button"
          aria-expanded={referralOpen}
          onClick={() => setReferralOpen((v) => !v)}
          className="text-sm font-semibold text-[#0cc1e0] transition-colors hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Have a referral code?
        </button>

        {referralOpen ? (
          <div className="mx-auto mt-3 flex max-w-sm items-center gap-2 rounded-xl bg-white/10 p-2 backdrop-blur-xs">
            <label htmlFor={referralInputId} className="sr-only">
              Referral code
            </label>
            <input
              suppressHydrationWarning
              id={referralInputId}
              type="text"
              autoComplete="off"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="Enter code here"
              className="min-w-0 flex-1 rounded-lg bg-white px-3 py-2 text-sm text-brand-950 outline-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-accent"
            />
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => {
                if (referralCode.trim()) setReferralApplied(true);
              }}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Apply
            </button>
          </div>
        ) : null}

        {referralApplied ? (
          <p className="mt-2 text-xs font-medium text-emerald-300">
            ✓ Referral code applied! Extra 5% discount unlocked.
          </p>
        ) : null}
      </div>
    </div>
  );
}

type PlanCardProps = {
  plan: Plan;
  active: boolean;
  months: number | null;
  onActivate: () => void;
  onChooseMonths: (months: number) => void;
};

function PlanCard({ plan, active, months, onActivate, onChooseMonths }: PlanCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <div
      // Clicking anywhere on the card makes it the active plan
      onClick={onActivate}
      className={`relative mt-8 flex cursor-pointer flex-col rounded-xl bg-white shadow-xl transition-all duration-200 ${
        active
          ? "ring-4 ring-accent lg:-translate-y-2 lg:shadow-2xl"
          : "opacity-95 hover:opacity-100 hover:shadow-2xl"
      } ${plan.popular ? "order-first lg:order-none" : ""}`}
    >
      {/* "Most popular" tab on top left of Plan C */}
      {plan.popular ? (
        <span className="absolute -top-7 left-0 rounded-t-md bg-[#7c82a2] px-4 py-1 text-xs font-semibold tracking-wide text-white shadow-xs">
          Most popular
        </span>
      ) : null}

      {/* Card Header */}
      <div className={`rounded-t-xl px-6 pb-5 pt-5 ${headerTone[plan.name] ?? "bg-slate-100"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-3xl font-medium tracking-tight text-slate-800">
              <button
                suppressHydrationWarning
                type="button"
                aria-pressed={active}
                onClick={onActivate}
                className="rounded text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {plan.name}
              </button>
            </h2>
            <span className="rounded border border-slate-300/80 bg-white px-2 py-0.5 text-xs font-medium text-slate-700 shadow-2xs">
              {plan.audience}
            </span>
          </div>
          <button
            suppressHydrationWarning
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onActivate();
              setDetailOpen(true);
            }}
            className="shrink-0 rounded border border-slate-700/60 bg-transparent px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Learn more
          </button>
        </div>
        <p className="mt-4 text-sm font-medium text-slate-800">{plan.includes}</p>
      </div>

      {/* Duration Options */}
      <fieldset className="space-y-1 p-5 bg-white">
        <legend className="sr-only">{plan.name} duration</legend>
        {plan.options.map((option) => {
          const isSelected = months === option.months;
          const showActiveIndicator = active && isSelected;
          return (
            <label
              key={option.months}
              onClick={() => onChooseMonths(option.months)}
              className={`group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 transition-colors ${
                showActiveIndicator ? "bg-slate-50" : "hover:bg-slate-50/70"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  suppressHydrationWarning
                  type="radio"
                  name={`course-${plan.name}`}
                  checked={isSelected}
                  onChange={() => onChooseMonths(option.months)}
                  className="sr-only"
                />
                {/* Styled radio circle */}
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all ${
                    showActiveIndicator
                      ? "border-accent bg-accent"
                      : isSelected
                        ? "border-slate-400 bg-white"
                        : "border-slate-300 bg-white group-hover:border-slate-400"
                  }`}
                >
                  {showActiveIndicator ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  ) : isSelected ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  ) : null}
                </span>
                <span className="text-sm font-medium text-slate-800">{option.months} Months</span>
                {option.recommended ? (
                  <span className="rounded bg-black px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                    Recommended
                  </span>
                ) : null}
              </div>
              <div className="text-right leading-tight">
                <span className="block text-sm font-semibold text-slate-900">
                  ₹ {option.price}
                </span>
                <span className="block text-[11px] text-slate-400 line-through">
                  ₹ {option.originalPrice}
                </span>
              </div>
            </label>
          );
        })}
      </fieldset>

      {/* Card Footer: Buy Now Button */}
      <div className="mt-auto rounded-b-xl border-t border-slate-100 bg-white p-5 pt-4">
        <button
          suppressHydrationWarning
          type="button"
          className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            active
              ? "bg-accent text-white shadow-md shadow-accent/25 hover:bg-accent-dark"
              : "border border-slate-300 bg-white text-brand-950 hover:bg-slate-50"
          }`}
        >
          Buy Now
        </button>
      </div>

      <PlanDetailDialog plan={plan} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </div>
  );
}

export default function CoursePlans({ plans }: { plans: Plan[] }) {
  const ordered = planOrder
    .map((name) => plans.find((p) => p.name === name))
    .filter((p): p is Plan => p !== undefined);

  // The popular plan (Plan C) starts out active
  const [active, setActive] = useState(ordered.find((p) => p.popular)?.name ?? ordered[0]?.name);
  const [months, setMonths] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(plans.map((p) => [p.name, p.defaultMonths ?? null])),
  );

  return (
    <>
      <CouponAndReferral />
      <div className="mt-8 grid items-stretch gap-x-6 gap-y-6 lg:grid-cols-3">
        {ordered.map((plan) => (
          <PlanCard
            key={plan.name}
            plan={plan}
            active={active === plan.name}
            months={months[plan.name]}
            onActivate={() => setActive(plan.name)}
            onChooseMonths={(m) => {
              setActive(plan.name);
              setMonths((prev) => ({ ...prev, [plan.name]: m }));
            }}
          />
        ))}
      </div>
    </>
  );
}
