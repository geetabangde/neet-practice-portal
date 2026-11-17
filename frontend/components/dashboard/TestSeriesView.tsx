"use client";

import Link from "next/link";
import { useState } from "react";
import { fetchSeriesTests, type SeriesTest, type TestKind } from "@/lib/studentContent";
import { useStudentFetch } from "@/lib/useStudentFetch";
import { ArrowRightIcon, ChevronDownIcon, ClockIcon, DocIcon } from "./icons";

type PatternFilter = "all" | SeriesTest["pattern"];

const TABS: { kind: TestKind; label: string }[] = [
  { kind: "grand", label: "Grand Tests" },
  { kind: "mini", label: "Mini Tests" },
  { kind: "subject", label: "Subject Tests" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const selectClass =
  "appearance-none rounded-full border border-slate-200 bg-white py-2 pl-4 pr-9 text-xs font-medium outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";
const messageClass = "mt-5 rounded-xl bg-white p-6 text-sm text-slate-600";
const startClass =
  "inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-xs font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

// "2025-09-08T09:30" -> its parts, read as plain text so it looks the same in every time zone
function parts(value: string) {
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day, monthName: MONTHS[month - 1], time };
}

// Academic year of a date, from April to March: "2025 - 26"
function academicYear(value: string): string {
  const { year, month } = parts(value);
  const start = month >= 4 ? year : year - 1;
  return `${start} - ${String((start + 1) % 100).padStart(2, "0")}`;
}

// The clock time the admin typed is compared with the clock of this computer
function toTime(value: string): number {
  const { year, month, day, time } = parts(value);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute).getTime();
}

// The Test Series page: the published tests, loaded from the server
export default function TestSeriesView() {
  const { state, reload } = useStudentFetch(fetchSeriesTests);

  if (state.status === "loading") {
    return (
      <p role="status" className={messageClass}>
        Loading the tests...
      </p>
    );
  }

  if (state.status !== "ready") {
    return (
      <div role="alert" className={`${messageClass} flex flex-wrap items-center gap-3`}>
        {state.status === "error" ? state.message : "The tests could not be loaded."}
        <button
          suppressHydrationWarning
          type="button"
          onClick={reload}
          className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Try again
        </button>
      </div>
    );
  }

  return <TestSeriesList tests={state.data.tests} />;
}

function TestSeriesList({ tests }: { tests: SeriesTest[] }) {
  const years = [...new Set(tests.map((t) => academicYear(t.startAt)))].sort().reverse();
  const [kind, setKind] = useState<TestKind>("grand");
  const [pattern, setPattern] = useState<PatternFilter>("all");
  const [year, setYear] = useState(years[0] ?? "");
  // Read once when the list opens
  const [now] = useState(() => Date.now());

  const inYear = tests.filter((t) => academicYear(t.startAt) === year);
  const visible = inYear.filter((t) => t.kind === kind && (pattern === "all" || t.pattern === pattern));

  const today = new Date(now);
  const testToday = tests.some((t) => {
    const p = parts(t.startAt);
    return p.year === today.getFullYear() && p.month === today.getMonth() + 1;
  });

  return (
    <>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Test Series</h1>
          {year ? <p className="mt-1 text-xs font-semibold uppercase">Year {year}</p> : null}
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
                {tab.label} ({inYear.filter((t) => t.kind === tab.kind).length})
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <label className="relative">
            <span className="sr-only">Year</span>
            <select suppressHydrationWarning value={year} onChange={(e) => setYear(e.target.value)} className={selectClass}>
              {years.length === 0 ? <option value="">No tests</option> : null}
              {years.map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          </label>
          <label className="relative">
            <span className="sr-only">Test type</span>
            <select suppressHydrationWarning value={pattern} onChange={(e) => setPattern(e.target.value as PatternFilter)} className={selectClass}>
              <option value="all">Test Type : All</option>
              <option value="INICET">Test Type : INICET</option>
              <option value="NEET">Test Type : NEET</option>
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          </label>
        </div>
      </div>

      {!testToday ? (
        <div className="mt-4 flex items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white/60 py-3 text-xs">
          <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
            <rect x="5" y="4" width="22" height="26" rx="3" fill="#4b5563" />
            <rect x="8" y="9" width="16" height="18" rx="1.5" fill="#fff" />
            <rect x="11" y="2" width="10" height="5" rx="2" fill="#9ca3af" />
            <path d="m12 14 8 8m0-8-8 8" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          No tests this month
        </div>
      ) : null}

      <div id="test-list" role="tabpanel" aria-labelledby={`tab-${kind}`}>
        {visible.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {visible.map((test) => {
              const start = parts(test.startAt);
              const end = parts(test.endAt);
              const upcoming = toTime(test.startAt) > now;
              const ended = test.status === "completed" || toTime(test.endAt) < now;
              return (
                <li key={test.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 sm:flex-nowrap sm:gap-4">
                  <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md bg-accent-soft leading-tight">
                    <span className="text-sm font-bold">{String(start.day).padStart(2, "0")}</span>
                    <span className="text-[10px]">{start.monthName}</span>
                  </div>
                  <div className="min-w-0 flex-1 basis-48">
                    <h3 className="text-base font-semibold leading-snug">{test.title}</h3>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-black/80">
                      <span>
                        {ended
                          ? `Ended on ${end.day} ${end.monthName}`
                          : upcoming
                            ? `Starts on ${start.day} ${start.monthName}, ${start.time}`
                            : `Open until ${end.day} ${end.monthName}, ${end.time}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <DocIcon className="h-3.5 w-3.5" />
                        {test.questionCount} MCQs
                      </span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-3.5 w-3.5" />
                        {test.durationMinutes} mins
                      </span>
                    </p>
                  </div>
                  <div className="ml-auto flex shrink-0 flex-col items-end gap-2">
                    {upcoming ? (
                      <span className="rounded-md bg-accent-soft px-5 py-2 text-xs font-medium">Coming soon</span>
                    ) : (
                      <Link href={`/dashboard/test-series/instructions?id=${test.id}`} className={startClass}>
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
          <p className="mt-4 rounded-xl bg-white p-6 text-center text-sm text-slate-600">No tests here yet.</p>
        )}
      </div>
    </>
  );
}
