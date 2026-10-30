"use client";

import { useState, type ReactNode } from "react";
import { customModuleTags, customSubjectModules, dashboardSubjects } from "@/data/dashboard";
import { ArrowRightIcon } from "./icons";
import ModuleReadyDialog, { type ReadyRow } from "./ModuleReadyDialog";
import SectionCard from "./SectionCard";
import SubjectPicker from "./SubjectPicker";

type Source = "all" | "qbank" | "bookmarked" | "graded";
type Mode = "regular" | "exam";
type QbankFilter = "attempted" | "incorrect" | "unattempted";

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  className: "h-4 w-4",
} as const;

const icons: Record<string, ReactNode> = {
  questions: (
    <svg {...iconProps}>
      <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  ),
  difficulty: (
    <svg {...iconProps}>
      <path d="M4 17a8 8 0 1 1 16 0M12 17l4-5" />
    </svg>
  ),
  source: (
    <svg {...iconProps}>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 9h6M9 13h6M9 17h3" />
    </svg>
  ),
  subjects: (
    <svg {...iconProps}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  ),
  tags: (
    <svg {...iconProps}>
      <path d="M4 12V5a1 1 0 0 1 1-1h7l8 8-8 8-8-8Z" />
      <path d="M8.5 8.5h.01" />
    </svg>
  ),
  mode: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </svg>
  ),
};

const stepperButton =
  "flex h-8 w-8 items-center justify-center rounded-md border text-lg leading-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

// Every option starts out as in the Figma design
export default function CustomModuleForm() {
  const [count, setCount] = useState(20);
  const [difficulty, setDifficulty] = useState(1);
  const [source, setSource] = useState<Source>("qbank");
  const [qbankFilters, setQbankFilters] = useState<Record<QbankFilter, boolean>>({
    attempted: false,
    incorrect: true,
    unattempted: true,
  });
  // Selected subject slug -> titles of its selected modules
  const [selected, setSelected] = useState<Record<string, string[]>>({
    anatomy: ["History of Medicine", "Epidemiology"],
    "community-medicine": ["History of Medicine", "Epidemiology"],
  });
  const [tags, setTags] = useState<string[]>(["#Numbers", "#recentNEET", "#Investigation_of_Choice"]);
  const [mode, setMode] = useState<Mode>("regular");
  const [readyOpen, setReadyOpen] = useState(false);

  const allModules = (slug: string) => (customSubjectModules[slug] ?? []).map((m) => m.title);
  const allSelected = dashboardSubjects.every((s) => s.slug in selected);

  function toggleSubject(slug: string) {
    setSelected((prev) => {
      if (slug in prev) {
        return Object.fromEntries(Object.entries(prev).filter(([key]) => key !== slug));
      }
      return { ...prev, [slug]: allModules(slug) };
    });
  }

  function toggleModule(slug: string, title: string) {
    setSelected((prev) => {
      const current = prev[slug] ?? [];
      const next = current.includes(title) ? current.filter((t) => t !== title) : [...current, title];
      return { ...prev, [slug]: next };
    });
  }

  function toggleAll() {
    setSelected(
      allSelected ? {} : Object.fromEntries(dashboardSubjects.map((s) => [s.slug, allModules(s.slug)])),
    );
  }

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  const sourceLabels: Record<Source, string> = {
    all: "All MCQs",
    qbank: "QBank MCQs",
    bookmarked: "Bookmarked MCQs",
    graded: "Graded Test MCQs",
  };
  const subjectNames = dashboardSubjects.filter((s) => s.slug in selected).map((s) => s.name);
  const chosenFilters = (["attempted", "incorrect", "unattempted"] as const)
    .filter((key) => qbankFilters[key])
    .map((key) => key.charAt(0).toUpperCase() + key.slice(1));
  const readyRows: ReadyRow[] = [
    { label: "Questions", value: String(count) },
    { label: "Difficulty Level", value: DIFFICULTIES[difficulty] },
    {
      label: "Subjects",
      value: subjectNames.length === 0 ? "None selected" : `${subjectNames.length} Subject${subjectNames.length === 1 ? "" : "s"}`,
      detail: subjectNames.length > 0 ? subjectNames.join(", ") : undefined,
    },
    {
      label: "Question Source",
      value: sourceLabels[source],
      detail: source === "qbank" && chosenFilters.length > 0 ? chosenFilters.join(", ") : undefined,
    },
  ];

  const radioClass = "h-3.5 w-3.5 accent-accent";

  return (
    <form onSubmit={(e) => {
        e.preventDefault();
        setReadyOpen(true);
      }} className="mt-5 space-y-4">
      <SectionCard
        icon={icons.questions}
        title="Number of Questions"
        subtitle="Select how many questions you want"
        action={
          <div className="flex items-center gap-2">
            <button
              suppressHydrationWarning
              type="button"
              aria-label="Fewer questions"
              onClick={() => setCount((c) => Math.max(1, c - 1))}
              className={`${stepperButton} border-slate-200 bg-white`}
            >
              &minus;
            </button>
            <output aria-label="Number of questions" className="w-8 text-center text-sm font-medium">
              {count}
            </output>
            <button
              suppressHydrationWarning
              type="button"
              aria-label="More questions"
              onClick={() => setCount((c) => c + 1)}
              className={`${stepperButton} border-accent bg-accent text-white`}
            >
              +
            </button>
          </div>
        }
      />

      <SectionCard icon={icons.difficulty} title="Difficulty Level" subtitle="Select how many questions you want">
        <div className="mt-4 px-1">
          <input
            suppressHydrationWarning
            type="range"
            min={0}
            max={2}
            step={1}
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
            aria-label="Difficulty level"
            aria-valuetext={DIFFICULTIES[difficulty]}
            className="h-1.5 w-full cursor-pointer accent-accent"
          />
          <div className="mt-1 flex justify-between text-[11px]" aria-hidden="true">
            {DIFFICULTIES.map((label, i) => (
              <span key={label} className={difficulty === i ? "font-medium text-accent-dark" : ""}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={icons.source} title="Question Form" subtitle="Choose the question source">
        <fieldset className="mt-3 space-y-2 text-xs">
          <legend className="sr-only">Question source</legend>
          <label className="flex items-center gap-2">
            <input suppressHydrationWarning type="radio" name="source" checked={source === "all"} onChange={() => setSource("all")} className={radioClass} />
            All MCQs
          </label>
          <label className="flex items-center gap-2">
            <input suppressHydrationWarning type="radio" name="source" checked={source === "qbank"} onChange={() => setSource("qbank")} className={radioClass} />
            QBank MCQs
          </label>
          <div className="space-y-1.5 pl-6 text-[11px]">
            {(["attempted", "incorrect", "unattempted"] as const).map((key) => (
              <label key={key} className="flex items-center gap-2 capitalize">
                <input
                  suppressHydrationWarning
                  type="checkbox"
                  checked={qbankFilters[key]}
                  disabled={source !== "qbank"}
                  onChange={() => setQbankFilters((prev) => ({ ...prev, [key]: !prev[key] }))}
                  className="h-3 w-3 accent-accent"
                />
                {key}
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2">
            <input suppressHydrationWarning type="radio" name="source" checked={source === "bookmarked"} onChange={() => setSource("bookmarked")} className={radioClass} />
            Bookmarked MCQs
          </label>
          <label className="flex items-center gap-2">
            <input suppressHydrationWarning type="radio" name="source" checked={source === "graded"} onChange={() => setSource("graded")} className={radioClass} />
            Graded Test MCQs
          </label>
        </fieldset>
      </SectionCard>

      <SectionCard
        icon={icons.subjects}
        title="Select Subjects"
        subtitle="Choose one or more subjects for your custom module"
        action={
          <div className="flex items-center gap-4 text-xs">
            <span className="font-medium">{Object.keys(selected).length} Selected</span>
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5">
              <input
                suppressHydrationWarning
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-3.5 w-3.5 accent-accent"
              />
              Select All
            </label>
          </div>
        }
      >
        <SubjectPicker selected={selected} onToggleSubject={toggleSubject} onToggleModule={toggleModule} />
      </SectionCard>

      <SectionCard icon={icons.tags} title="Tags" subtitle="Choose the question source">
        <ul className="mt-3 flex flex-wrap gap-2">
          {customModuleTags.map((tag) => {
            const on = tags.includes(tag);
            return (
              <li key={tag}>
                <button
                  suppressHydrationWarning
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleTag(tag)}
                  className={`rounded px-3 py-1.5 text-[11px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    on ? "bg-accent font-medium text-white" : "bg-accent-soft hover:bg-accent/20"
                  }`}
                >
                  {tag}
                </button>
              </li>
            );
          })}
        </ul>
      </SectionCard>

      <SectionCard icon={icons.mode} title="Mode" subtitle="Choose the question source">
        <fieldset className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
          <legend className="sr-only">Mode</legend>
          <label className="flex items-start gap-2">
            <input suppressHydrationWarning type="radio" name="mode" checked={mode === "regular"} onChange={() => setMode("regular")} className={`${radioClass} mt-0.5`} />
            <span>
              <span className="block font-medium">Regular</span>
              <span className="block text-[11px] text-slate-600">See answer and explanation after solving each MCQ</span>
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input suppressHydrationWarning type="radio" name="mode" checked={mode === "exam"} onChange={() => setMode("exam")} className={`${radioClass} mt-0.5`} />
            <span>
              <span className="block font-medium">Exam Mode</span>
              <span className="block text-[11px] text-slate-600">Review answers only after completing the module</span>
            </span>
          </label>
        </fieldset>
      </SectionCard>

      <div className="flex justify-end pb-2">
        <button
          suppressHydrationWarning
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-xs font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Generate Module
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
      <ModuleReadyDialog
        open={readyOpen}
        onClose={() => setReadyOpen(false)}
        rows={readyRows}
        startHref={`/dashboard/custom-module/solve?count=${count}`}
      />
    </form>
  );
}
