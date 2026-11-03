"use client";

import Link from "next/link";
import { useState } from "react";
import type { TestItem, TestKind } from "@/types/dashboard";
import { ArrowRightIcon, ChevronDownIcon, ClockIcon, DocIcon, LockIcon } from "./icons";
import ProDialog from "./ProDialog";

type TestSeriesViewProps = {
  year: string;
  tests: Record<TestKind, TestItem[]>;
};

type PatternFilter = "all" | TestItem["pattern"];

const TABS: { kind: TestKind; label: string }[] = [
  { kind: "grand", label: "Grand Tests" },
  { kind: "mini", label: "Mini Tests" },
  { kind: "subject", label: "Subject Tests" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const selectClass =
  "appearance-none rounded-full border border-slate-200 bg-white py-2 pl-4 pr-9 text-xs font-medium outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

// Reads the date as plain text, so it looks the same in every time zone
function splitDate(iso: string) {
  const [, month, day] = iso.split("-").map(Number);
  return { day: String(day).padStart(2, "0"), month: MONTHS[month - 1], plainDay: String(day) };
}

export default function TestSeriesView({ year, tests }: TestSeriesViewProps) {
  const [kind, setKind] = useState<TestKind>("grand");
  const [pattern, setPattern] = useState<PatternFilter>("all");
  const [proOpen, setProOpen] = useState(false);

  const visible = tests[kind].filter((test) => pattern === "all" || test.pattern === pattern);

  return (
    <>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Test Series</h1>
          <p className="mt-1 text-xs font-semibold uppercase">Year {year}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Test categories" className="flex border-b border-slate-200">
          {TABS.map((tab) => {
            const active = tab.kind === kind;
            return (
              <button
                suppressHydrationWarning
                key={tab.kind}
                type="button"
                role="tab"
                id={`tab-${tab.kind}`}
                aria-selected={active}
                aria-controls="test-list"
                onClick={() => setKind(tab.kind)}
                className={`rounded-t-md px-4 py-2 text-xs font-medium focus-visible:outline-2 focus-visible:outline-accent ${
                  active ? "bg-accent text-white" : "hover:bg-slate-100"
                }`}
              >
                {tab.label} ({tests[tab.kind].length})
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <label className="relative">
            <span className="sr-only">Year</span>
            <select suppressHydrationWarning defaultValue={year} className={selectClass}>
              <option value={year}>Year {year}</option>
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          </label>
          <label className="relative">
            <span className="sr-only">Test type</span>
            <select
              suppressHydrationWarning
              value={pattern}
              onChange={(e) => setPattern(e.target.value as PatternFilter)}
              className={selectClass}
            >
              <option value="all">Test Type : All</option>
              <option value="INICET">Test Type : INICET</option>
              <option value="NEET">Test Type : NEET</option>
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          </label>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white/60 py-3 text-xs">
        <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
          <rect x="5" y="4" width="22" height="26" rx="3" fill="#4b5563" />
          <rect x="8" y="9" width="16" height="18" rx="1.5" fill="#fff" />
          <rect x="11" y="2" width="10" height="5" rx="2" fill="#9ca3af" />
          <path d="m12 14 8 8m0-8-8 8" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        No tests this month
      </div>

      <div id="test-list" role="tabpanel" aria-labelledby={`tab-${kind}`}>
        {visible.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {visible.map((test) => {
              const { day, month, plainDay } = splitDate(test.date);
              return (
                <li
                  key={test.title}
                  className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 sm:flex-nowrap sm:gap-4"
                >
                  <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md bg-accent-soft leading-tight">
                    <span className="text-sm font-bold">{day}</span>
                    <span className="text-[10px]">{month}</span>
                  </div>
                  <div className="min-w-0 flex-1 basis-48">
                    <h3 className="text-base font-semibold leading-snug">{test.title}</h3>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-black/80">
                      <span>
                        Ended on {plainDay} {month}
                      </span>
                      <span className="flex items-center gap-1">
                        <DocIcon className="h-3.5 w-3.5" />
                        {test.mcqs} MCQs
                      </span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-3.5 w-3.5" />
                        {test.minutes} mins
                      </span>
                    </p>
                  </div>
                  <div className="ml-auto flex shrink-0 flex-col items-end gap-2">
                    {test.locked ? (
                      <span className="inline-flex items-center gap-1 rounded bg-black px-2 py-0.5 text-[10px] font-semibold text-white">
                        <LockIcon className="h-3 w-3" />
                        GET
                      </span>
                    ) : null}
                    {test.mock ? (
                      <span className="rounded-md bg-accent-soft px-5 py-2 text-xs font-medium">Mock Test</span>
                    ) : null}
                    {test.locked ? (
                      <button
                        suppressHydrationWarning
                        type="button"
                        onClick={() => setProOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-xs font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        Start Test
                        <ArrowRightIcon className="h-4 w-4" />
                      </button>
                    ) : (
                      <Link href="/dashboard/test-series/instructions" className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-xs font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                        Start Test
                        <ArrowRightIcon className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 rounded-xl bg-white p-6 text-center text-sm text-slate-600">
            No tests here yet.
          </p>
        )}
      </div>

      <ProDialog open={proOpen} onClose={() => setProOpen(false)} />
    </>
  );
}
