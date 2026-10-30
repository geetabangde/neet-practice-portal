import { DocIcon } from "./icons";

import type { TestQuestionStatus as PaletteStatus } from "@/types/dashboard";

export type { PaletteStatus };

const statusColor: Record<PaletteStatus, string> = {
  notVisited: "bg-[#9e9e9e]",
  notAnswered: "bg-[#ff4444]",
  answered: "bg-[#2fd36a]",
  marked: "bg-[#6b3fa0]",
  answeredMarked: "bg-[#6b3fa0]",
};

const statusLabel: Record<PaletteStatus, string> = {
  notVisited: "Not Visited",
  notAnswered: "Not Answered",
  answered: "Answered",
  marked: "Marked for Review",
  answeredMarked: "Answered & Marked for Review",
};

const legendOrder: PaletteStatus[] = ["notVisited", "notAnswered", "answered", "marked", "answeredMarked"];

// Small purple/white badge for "answered and marked for review"
function Badge() {
  return (
    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[#6b3fa0] shadow-sm">
      <DocIcon className="h-3 w-3" />
    </span>
  );
}

type QuestionPaletteProps = {
  // Status of every question, in order
  statuses: PaletteStatus[];
  // Questions that exist so far (the first ones). The rest cannot be opened yet.
  availableCount: number;
  current: number;
  onSelect: (index: number) => void;
};

export default function QuestionPalette({ statuses, availableCount, current, onSelect }: QuestionPaletteProps) {
  return (
    <aside aria-labelledby="palette-title" className="rounded-xl bg-white p-4">
      <h2 id="palette-title" className="text-2xl font-semibold">
        Choose a Question
      </h2>

      <ul className="mt-4 flex flex-wrap gap-2">
        {legendOrder.map((status) => (
          <li
            key={status}
            className="flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1.5 text-[11px]"
          >
            <span
              aria-hidden="true"
              className={`relative flex h-4 w-4 items-center justify-center rounded-sm text-[9px] text-white ${statusColor[status]}`}
            >
              1
              {status === "answeredMarked" ? (
                <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-white" />
              ) : null}
            </span>
            {statusLabel[status]}
          </li>
        ))}
      </ul>

      <ol className="mt-6 grid grid-cols-5 gap-3">
        {statuses.map((status, i) => {
          const loaded = i < availableCount;
          const isCurrent = i === current;
          return (
            <li key={i}>
              <button
                suppressHydrationWarning
                type="button"
                disabled={!loaded}
                onClick={() => onSelect(i)}
                aria-current={isCurrent ? "true" : undefined}
                aria-label={`Question ${i + 1}, ${statusLabel[status]}${loaded ? "" : ", not available yet"}`}
                className={`relative flex aspect-square w-full items-center justify-center rounded-md text-xs font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed ${
                  statusColor[status]
                } ${isCurrent ? "outline outline-2 outline-offset-2 outline-brand-950" : ""}`}
              >
                {i + 1}
                {status === "answeredMarked" ? <Badge /> : null}
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
