"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { getToken } from "@/lib/studentAuth";
import { createCustomModule, fetchCustomOptions, type PickerSubject } from "@/lib/studentContent";
import { useStudentFetch } from "@/lib/useStudentFetch";
import { ArrowRightIcon } from "./icons";
import ModuleReadyDialog, { type ReadyRow } from "./ModuleReadyDialog";
import SectionCard from "./SectionCard";
import SubjectPicker from "./SubjectPicker";

type Source = "all" | "qbank" | "bookmarked" | "graded";
type QbankFilter = "attempted" | "incorrect" | "unattempted";

const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
const MAX_QUESTIONS = 200;

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
  mode: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </svg>
  ),
};

const stepperButton =
  "flex h-8 w-8 items-center justify-center rounded-md border text-lg leading-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const messageClass = "mt-5 rounded-xl bg-white p-6 text-sm text-slate-600";

// The subjects and modules to choose from come from the server
export default function CustomModuleForm() {
  const { state, reload } = useStudentFetch(fetchCustomOptions);

  if (state.status === "loading") {
    return (
      <p role="status" className={messageClass}>
        Loading subjects...
      </p>
    );
  }

  if (state.status !== "ready") {
    return (
      <div role="alert" className={`${messageClass} flex flex-wrap items-center gap-3`}>
        {state.status === "error" ? state.message : "The subjects could not be loaded."}
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

  return <FormBody subjects={state.data.subjects} />;
}

function FormBody({ subjects }: { subjects: PickerSubject[] }) {
  const [count, setCount] = useState(20);
  const [difficulty, setDifficulty] = useState(1);
  const [source, setSource] = useState<Source>("qbank");
  const [qbankFilters, setQbankFilters] = useState<Record<QbankFilter, boolean>>({
    attempted: false,
    incorrect: true,
    unattempted: true,
  });
  // Subject id -> ids of its ticked modules
  const [selected, setSelected] = useState<Record<number, number[]>>({});
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  // The module the server made, shown in the "ready" pop-up
  const [ready, setReady] = useState<{ id: number; questionCount: number; matching: number } | null>(null);

  const withModules = subjects.filter((s) => s.modules.length > 0);
  const selectedCount = Object.keys(selected).length;
  const allSelected = withModules.length > 0 && withModules.every((s) => s.id in selected);
  const moduleIds = Object.values(selected).flat();

  function toggleSubject(subject: PickerSubject) {
    setSelected((prev) => {
      if (subject.id in prev) return Object.fromEntries(Object.entries(prev).filter(([key]) => Number(key) !== subject.id));
      return { ...prev, [subject.id]: subject.modules.map((m) => m.id) };
    });
  }

  function toggleModule(subject: PickerSubject, moduleId: number) {
    setSelected((prev) => {
      const current = prev[subject.id] ?? [];
      const next = current.includes(moduleId) ? current.filter((id) => id !== moduleId) : [...current, moduleId];
      // A subject with no module ticked is not chosen any more
      if (next.length === 0) return Object.fromEntries(Object.entries(prev).filter(([key]) => Number(key) !== subject.id));
      return { ...prev, [subject.id]: next };
    });
  }

  function toggleAll() {
    setSelected(allSelected ? {} : Object.fromEntries(withModules.map((s) => [s.id, s.modules.map((m) => m.id)])));
  }

  // "Graded Test MCQs" cannot be chosen yet, so the server only ever hears about these three
  const apiSource: "all" | "qbank" | "bookmarked" = source === "all" || source === "bookmarked" ? source : "qbank";

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getToken();
    if (!token || generating) return;
    setError("");
    setGenerating(true);
    const result = await createCustomModule(token, {
      count,
      difficulty: (["easy", "medium", "hard"] as const)[difficulty],
      source: apiSource,
      qbank: qbankFilters,
      moduleIds,
    });
    setGenerating(false);
    if (!result.ok) return setError(result.message);
    setReady(result.data.module);
  }

  const sourceLabels: Record<"all" | "qbank" | "bookmarked", string> = { all: "All MCQs", qbank: "QBank MCQs", bookmarked: "Bookmarked MCQs" };
  const subjectNames = subjects.filter((s) => s.id in selected).map((s) => s.name);
  const chosenFilters = (["attempted", "incorrect", "unattempted"] as const)
    .filter((key) => qbankFilters[key])
    .map((key) => key.charAt(0).toUpperCase() + key.slice(1));
  const readyRows: ReadyRow[] = [
    {
      label: "Questions",
      value: String(ready?.questionCount ?? count),
      // Fewer questions than asked for: say so
      detail: ready && ready.questionCount < count ? `you asked for ${count}, only ${ready.matching} match your choices` : undefined,
    },
    { label: "Difficulty Level", value: DIFFICULTIES[difficulty] },
    {
      label: "Subjects",
      value: `${subjectNames.length} Subject${subjectNames.length === 1 ? "" : "s"}`,
      detail: subjectNames.join(", "),
    },
    {
      label: "Question Source",
      value: sourceLabels[apiSource],
      detail: source === "qbank" && chosenFilters.length > 0 ? chosenFilters.join(", ") : undefined,
    },
  ];

  const radioClass = "h-3.5 w-3.5 accent-accent";
  const comingSoon = <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">Coming soon</span>;
  const canGenerate = moduleIds.length > 0 && !generating && (source !== "qbank" || chosenFilters.length > 0);

  return (
    <form onSubmit={(event) => void generate(event)} className="mt-5 space-y-4">
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
              onClick={() => setCount((c) => Math.min(MAX_QUESTIONS, c + 1))}
              className={`${stepperButton} border-accent bg-accent text-white`}
            >
              +
            </button>
          </div>
        }
      />

      <SectionCard icon={icons.difficulty} title="Difficulty Level" subtitle="Questions of this level come first. If there are not enough, the nearest level fills the rest.">
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
          <label className="flex items-center gap-2 opacity-60">
            <input suppressHydrationWarning type="radio" name="source" disabled className={radioClass} />
            Graded Test MCQs {comingSoon}
          </label>
        </fieldset>
      </SectionCard>

      <SectionCard
        icon={icons.subjects}
        title="Select Subjects"
        subtitle="Choose one or more subjects and the modules you want to practise"
        action={
          <div className="flex items-center gap-4 text-xs">
            <span className="font-medium">{selectedCount} Selected</span>
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5">
              <input suppressHydrationWarning type="checkbox" checked={allSelected} onChange={toggleAll} className="h-3.5 w-3.5 accent-accent" />
              Select All
            </label>
          </div>
        }
      >
        <SubjectPicker subjects={subjects} selected={selected} onToggleSubject={toggleSubject} onToggleModule={toggleModule} />
      </SectionCard>

      <SectionCard icon={icons.mode} title="Mode" subtitle="How the questions are shown while you solve">
        <fieldset className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
          <legend className="sr-only">Mode</legend>
          <label className="flex items-start gap-2">
            <input suppressHydrationWarning type="radio" name="mode" checked readOnly className={`${radioClass} mt-0.5`} />
            <span>
              <span className="block font-medium">Regular</span>
              <span className="block text-[11px] text-slate-600">See answer and explanation after solving each MCQ</span>
            </span>
          </label>
          <label className="flex items-start gap-2 opacity-60">
            <input suppressHydrationWarning type="radio" name="mode" disabled className={`${radioClass} mt-0.5`} />
            <span>
              <span className="block font-medium">Exam Mode {comingSoon}</span>
              <span className="block text-[11px] text-slate-600">Review answers only after completing the module</span>
            </span>
          </label>
        </fieldset>
      </SectionCard>

      <div role="status" aria-live="polite">
        {error ? <p className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error}</p> : null}
        {!error && moduleIds.length === 0 ? <p className="text-xs text-slate-600">Choose at least one subject to generate a module.</p> : null}
      </div>

      <div className="flex justify-end pb-2">
        <button
          suppressHydrationWarning
          type="submit"
          disabled={!canGenerate}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-xs font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generating ? "Generating..." : "Generate Module"}
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>

      <ModuleReadyDialog
        open={ready !== null}
        onClose={() => setReady(null)}
        rows={readyRows}
        startHref={ready ? `/dashboard/custom-module/solve?id=${ready.id}` : "/dashboard/custom-module"}
      />
    </form>
  );
}
