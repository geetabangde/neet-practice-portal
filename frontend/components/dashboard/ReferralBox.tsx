"use client";

import { useId, useState } from "react";

export default function ReferralBox() {
  const inputId = useId();
  const [code, setCode] = useState("");

  return (
    <div className="mx-auto mt-5 w-full max-w-xl">
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-2.5">
        <svg viewBox="0 0 24 24" fill="none" stroke="#f5b400" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
          <path d="M3 9a2 2 0 0 0 0 6v2a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-2a2 2 0 0 1 0-6V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v2Z" />
          <path d="m9.5 14.5 5-5M9.5 9.5h.01M14.5 14.5h.01" />
        </svg>
        <label htmlFor={inputId} className="text-sm font-semibold">
          Have a referral code?
        </label>
        <input
          suppressHydrationWarning
          id={inputId}
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter code here"
          autoComplete="off"
          className="w-40 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs outline-none placeholder:text-slate-500 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
        />
        <button
          suppressHydrationWarning
          type="button"
          className="rounded-md bg-accent px-5 py-2 text-xs font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
