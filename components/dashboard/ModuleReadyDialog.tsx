"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRightIcon, CloseIcon } from "./icons";

export type ReadyRow = {
  label: string;
  value: string;
  // Smaller line under the value, e.g. the subject names
  detail?: string;
};

type ModuleReadyDialogProps = {
  open: boolean;
  onClose: () => void;
  rows: ReadyRow[];
  // Where "Start Module" leads
  startHref: string;
};

// Shown after "Generate Module", with a summary of the chosen settings
export default function ModuleReadyDialog({ open, onClose, rows, startHref }: ModuleReadyDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

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
      aria-labelledby="ready-title"
      aria-describedby="ready-description"
      className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl bg-tint p-0 text-brand-950 shadow-2xl backdrop:bg-black/50"
    >
      <div className="relative p-6 sm:p-8">
        <button
          suppressHydrationWarning
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-5 top-5 rounded-lg p-1 hover:bg-slate-200/60 focus-visible:outline-2 focus-visible:outline-accent"
        >
          <CloseIcon className="h-6 w-6" />
        </button>

        {/* Clipboard picture, drawn here because there is no image file for it */}
        <svg viewBox="0 0 64 80" className="mx-auto h-20 w-16" aria-hidden="true">
          <rect x="6" y="8" width="52" height="68" rx="7" fill="#f4c9a0" />
          <rect x="11" y="14" width="42" height="57" rx="4" fill="#fff" />
          <rect x="22" y="2" width="20" height="12" rx="4" fill="#9ec9ea" />
          <path d="M17 26h14M17 33h14M17 40h14" stroke="#9aa5b1" strokeWidth="3" strokeLinecap="round" />
          <text x="40" y="32" fontSize="11" fontWeight="700" fill="#4cc38a">A</text>
          <text x="40" y="44" fontSize="11" fontWeight="700" fill="#5ab0f0">B</text>
          <path
            d="m24 60 1.6 3.2 3.4.5-2.5 2.4.6 3.4-3.1-1.6-3.1 1.6.6-3.4-2.5-2.4 3.4-.5L24 60Zm14 0 1.6 3.2 3.4.5-2.5 2.4.6 3.4-3.1-1.6-3.1 1.6.6-3.4-2.5-2.4 3.4-.5L38 60Z"
            fill="#f7b731"
          />
        </svg>

        <h2 id="ready-title" className="mt-4 text-center text-2xl font-semibold">
          Your Custom Module is Ready!
        </h2>
        <p id="ready-description" className="mt-2 text-center text-xs">
          Review your settings below and start the test whenever you are ready.
        </p>

        <dl className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white px-4 text-xs">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4 py-3">
              <dt>{row.label}</dt>
              <dd className="text-right">
                <span className="block text-sm font-semibold">{row.value}</span>
                {row.detail ? <span className="block text-[11px] text-slate-700">({row.detail})</span> : null}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 flex justify-center">
          <Link
            href={startHref}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-xs font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Start Module
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </dialog>
  );
}
