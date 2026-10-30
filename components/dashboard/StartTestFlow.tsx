"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { ArrowRightIcon, CloseIcon } from "./icons";
import InstructionAccordion from "./InstructionAccordion";
import { useModalDialog } from "./useModalDialog";

type StartTestFlowProps = {
  // The numbered "other instructions", rendered on the server
  instructions: ReactNode;
  ndaTitle: string;
  ndaParagraphs: string[];
};

const dialogClass =
  "m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-tint p-0 text-brand-950 shadow-2xl backdrop:bg-black/50";
const closeButtonClass =
  "absolute right-4 top-4 rounded-lg p-1 hover:bg-slate-200/60 focus-visible:outline-2 focus-visible:outline-accent";
const primaryButtonClass =
  "w-full rounded-lg bg-accent px-4 py-2.5 text-xs font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

type Popup = "info" | "confirm" | null;

// "Other Important Instructions" with the agreement checkbox, the
// "I am ready to begin" button and its two pop-ups
export default function StartTestFlow({ instructions, ndaTitle, ndaParagraphs }: StartTestFlowProps) {
  // Starts unticked: the first click on "I am ready to begin" asks for the agreement
  const [accepted, setAccepted] = useState(false);
  const checkboxRef = useRef<HTMLInputElement>(null);
  const [popup, setPopup] = useState<Popup>(null);

  const infoRef = useModalDialog(popup === "info");
  const confirmRef = useModalDialog(popup === "confirm");
  const close = () => setPopup(null);

  // After the Info pop-up: open the section that holds the agreement and focus the checkbox
  function showAgreement() {
    close();
    setTimeout(() => {
      const checkbox = checkboxRef.current;
      if (!checkbox) return;
      const section = checkbox.closest("details");
      if (section) section.open = true;
      checkbox.scrollIntoView({ block: "center" });
      checkbox.focus();
    }, 50);
  }

  return (
    <>
      <InstructionAccordion title="Other Important Instructions">
        {instructions}

        <label className="mt-4 flex items-center gap-2 text-xs font-medium uppercase text-red-500">
          <input
            ref={checkboxRef}
            suppressHydrationWarning
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="h-3.5 w-3.5 accent-accent"
          />
          {ndaTitle}
        </label>
        <div className="mt-3 space-y-3 text-xs">
          {ndaParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </InstructionAccordion>

      <div className="mt-6 flex justify-end pb-2">
        <button
          suppressHydrationWarning
          type="button"
          onClick={() => setPopup(accepted ? "confirm" : "info")}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-xs font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          I am ready to begin
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>

      <dialog
        ref={infoRef}
        onClose={close}
        onClick={(e) => {
          if (e.target === infoRef.current) close();
        }}
        aria-labelledby="info-title"
        aria-describedby="info-message"
        className={dialogClass}
      >
        <div className="relative p-6 text-center sm:p-8">
          <button suppressHydrationWarning type="button" onClick={close} aria-label="Close" className={closeButtonClass}>
            <CloseIcon className="h-6 w-6" />
          </button>
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true" className="h-7 w-7">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5M12 7.5h.01" />
            </svg>
          </span>
          <h2 id="info-title" className="mt-4 text-xl font-bold">
            Info
          </h2>
          <p id="info-message" className="mt-2 text-xs">
            Please accept the NON DISCLOSURE AGREEMENT before proceeding.
          </p>
          <button suppressHydrationWarning type="button" onClick={showAgreement} className={`${primaryButtonClass} mt-5`}>
            Ok
          </button>
        </div>
      </dialog>

      <dialog
        ref={confirmRef}
        onClose={close}
        onClick={(e) => {
          if (e.target === confirmRef.current) close();
        }}
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className={dialogClass}
      >
        <div className="relative p-6 text-center sm:p-8">
          <button suppressHydrationWarning type="button" onClick={close} aria-label="Close" className={closeButtonClass}>
            <CloseIcon className="h-6 w-6" />
          </button>
          <h2 id="confirm-title" className="px-4 text-2xl font-semibold leading-tight">
            Are you sure you want to start the test?
          </h2>
          <p id="confirm-message" className="mt-3 text-xs">
            Once you start the test, the timer cannot be paused. You will lose your progress if you change your
            browser or device. Ensure your device has enough battery for the duration of the test.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <button
              suppressHydrationWarning
              type="button"
              onClick={close}
              className="rounded-lg border border-accent bg-white px-4 py-2.5 text-xs font-semibold hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              No
            </button>
            <Link href="/dashboard/test-series/attempt" className={`${primaryButtonClass} block text-center`}>
              Yes
            </Link>
          </div>
        </div>
      </dialog>
    </>
  );
}
