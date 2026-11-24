"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { plans } from "@/data/dashboard";
import { clearToken, getToken } from "@/lib/studentAuth";
import { purchasePlan, type CurrentPlan } from "@/lib/studentContent";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2027-11-17" -> "17 Nov 2027"
function niceDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

// The purchase screen: what the student is buying and the price, then "Proceed to payment".
// No payment gateway is connected yet. The server (in demo mode) takes no money and activates the plan at once.
export default function PlanCheckout({ planName, months }: { planName: string; months: number }) {
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bought, setBought] = useState<CurrentPlan | null>(null);

  const plan = plans.find((p) => p.name === planName);
  const option = plan?.options.find((o) => o.months === months);

  if (!plan || !option) {
    return (
      <p role="alert" className="mt-6 rounded-xl bg-white p-6 text-sm text-slate-600">
        This plan or duration was not found.{" "}
        <Link href="/dashboard/plans" className="font-semibold text-accent-dark hover:underline">
          Back to Plans
        </Link>
      </p>
    );
  }

  const discount = option.originalPrice - option.price;
  // Kept in a constant: inside pay() TypeScript no longer knows that "option" exists
  const price = option.price;

  async function pay() {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setPaying(true);
    setError(null);
    const result = await purchasePlan(token, planName, months, price);
    setPaying(false);
    if (result.ok) {
      setBought(result.data.plan);
    } else if (result.status === 401 || result.status === 403) {
      clearToken();
      router.replace("/login");
    } else {
      setError(result.message);
    }
  }

  if (bought) {
    return (
      <div className="mx-auto mt-8 w-full max-w-lg rounded-xl bg-white p-8 text-center shadow-sm">
        <span aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl font-bold text-green-700">
          ✓
        </span>
        <h1 className="mt-4 text-2xl font-bold">Payment successful</h1>
        <p role="status" className="mt-2 text-sm">
          <strong>{bought.name}</strong> is active
          {bought.expiresAt ? ` until ${niceDate(bought.expiresAt)}` : ""}.
        </p>
        <p className="mt-1 text-xs text-slate-600">Mini Tests, Subject Tests and everything in your plan are now unlocked.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard/test-series" className="rounded-lg bg-accent px-6 py-2.5 text-xs font-semibold text-white hover:bg-accent-dark">
            Go to Test Series
          </Link>
          <Link href="/dashboard" className="rounded-lg border border-accent bg-white px-6 py-2.5 text-xs font-semibold hover:bg-accent-soft">
            Go to QBank
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold leading-none">{plan.name}</h1>
          <span className="rounded bg-black px-2 py-0.5 text-[10px] font-semibold text-white">{plan.audience}</span>
        </div>
        <p className="mt-2 text-xs text-slate-600">{plan.includes}</p>

        {plan.features ? (
          <ul className="mt-5 space-y-3 text-sm">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-0.5 text-green-600">
                  ✓
                </span>
                {feature}
              </li>
            ))}
          </ul>
        ) : null}

        <p className="mt-6 rounded-lg bg-yellow-50 p-3 text-center text-xs text-slate-700">
          Demo mode: no money is taken. Your plan is activated as soon as you press Proceed to payment.
        </p>

        <section aria-labelledby="summary-title" className="mt-6">
          <h2 id="summary-title" className="text-center text-lg font-bold">
            Purchase Summary
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="font-semibold">Duration</dt>
              <dd>{option.months} Months</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-semibold">Price</dt>
              <dd>{rupees(option.originalPrice)}</dd>
            </div>
            {discount > 0 ? (
              <div className="flex justify-between">
                <dt className="font-semibold">Plan discount</dt>
                <dd className="text-green-600">- {rupees(discount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold">
              <dt>Final Price</dt>
              <dd>{rupees(option.price)}</dd>
            </div>
          </dl>
        </section>

        <div role="status" aria-live="polite">
          {error ? <p className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error}</p> : null}
        </div>
      </div>

      <div className="sticky bottom-0 z-10 mt-4 flex items-center justify-between gap-4 rounded-t-xl bg-white px-5 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.12)]">
        <div>
          <p className="text-lg font-bold">{rupees(option.price)}</p>
          <p className="text-[11px] text-slate-600">
            {plan.name}, {option.months} Months
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/plans" className="text-xs font-semibold text-accent-dark hover:underline">
            Change plan
          </Link>
          <button
            suppressHydrationWarning
            type="button"
            disabled={paying}
            onClick={() => void pay()}
            className="rounded-md bg-[#5ec6e0] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#46b5d1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5ec6e0] disabled:opacity-60"
          >
            {paying ? "Processing..." : "Proceed to payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
