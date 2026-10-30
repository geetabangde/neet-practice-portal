"use client";

import { useEffect, useId, useRef } from "react";
import type { Plan } from "@/types/dashboard";
import { CloseIcon } from "./icons";

type PlanDetailDialogProps = {
  plan: Plan;
  open: boolean;
  onClose: () => void;
};

// "Learn More" pop-up with what a plan includes
export default function PlanDetailDialog({ plan, open, onClose }: PlanDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      aria-labelledby={titleId}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-tint p-0 text-brand-950 shadow-2xl backdrop:bg-black/50"
    >
      <div className="relative p-6 sm:p-8">
        <button
          suppressHydrationWarning
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-1 hover:bg-slate-200/60 focus-visible:outline-2 focus-visible:outline-accent"
        >
          <CloseIcon className="h-6 w-6" />
        </button>

        <h2 id={titleId} className="text-2xl font-bold leading-none">
          {plan.name}
        </h2>
        <span className="mt-2 inline-block rounded bg-black px-2 py-0.5 text-[10px] font-semibold text-white">
          {plan.audience}
        </span>
        <p className="mt-6 text-xs">{plan.includes}</p>

        {plan.features && plan.features.length > 0 ? (
          <ul className="mt-4 space-y-2.5 rounded-lg bg-white p-4 shadow-sm">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-xs">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-2.5 w-2.5">
                    <path d="m5 12.5 4.5 4.5L19 7.5" />
                  </svg>
                </span>
                {feature}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-lg bg-white p-4 text-xs text-slate-600 shadow-sm">
            The full list of what {plan.name} includes will be added soon.
          </p>
        )}
      </div>
    </dialog>
  );
}
