"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { CloseIcon, LockIcon } from "./icons";

type ProDialogProps = {
  open: boolean;
  onClose: () => void;
};

// Shown when someone opens a locked (GET) module
export default function ProDialog({ open, onClose }: ProDialogProps) {
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
      aria-labelledby="pro-title"
      aria-describedby="pro-description"
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

        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white">
          <LockIcon className="h-8 w-8" />
        </span>

        <h2 id="pro-title" className="mt-6 text-center text-2xl font-semibold leading-tight">
          This MCQ module is available only for Pro users
        </h2>
        <p id="pro-description" className="mt-3 text-center text-xs">
          Unlock unlimited access to all questions, detailed explanations, notes and more.
        </p>

        <Link
          href="/dashboard/plans"
          className="mt-6 block w-full rounded-lg bg-accent px-4 py-2.5 text-center text-xs font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Subscribe Now
        </Link>
      </div>
    </dialog>
  );
}
