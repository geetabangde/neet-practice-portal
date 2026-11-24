import type { CSSProperties } from "react";
import type { PaletteStatus } from "./QuestionPalette";

const LABEL: Record<PaletteStatus, string> = {
  notVisited: "Not Visited",
  notAnswered: "Not Answered",
  answered: "Answered",
  marked: "Marked for Review",
  answeredMarked:
    "Answered & Marked for Review (will be considered for evaluation)",
};

const SHORT: Record<PaletteStatus, string> = {
  notVisited: "Not Visited",
  notAnswered: "Not Answered",
  answered: "Answered",
  marked: "Marked for Review",
  answeredMarked: "Answered & Marked for Review",
};

// answered: points up (green), not answered: points down (red), marked: purple circle, not visited: grey square
const CLIP: Partial<Record<PaletteStatus, CSSProperties>> = {
  answered: { clipPath: "polygon(50% 0, 100% 22%, 100% 100%, 0 100%, 0 22%)" },
  notAnswered: { clipPath: "polygon(0 0, 100% 0, 100% 78%, 50% 100%, 0 78%)" },
};

const FILL: Record<PaletteStatus, string> = {
  notVisited:
    "bg-gradient-to-b from-[#fafafa] to-[#dcdcdc] text-black border border-[#9a9a9a] rounded-[3px] shadow-[0_2px_3px_rgba(0,0,0,0.25)]",
  notAnswered: "bg-gradient-to-b from-[#ff6a3d] to-[#d83a12] text-white",
  answered: "bg-gradient-to-b from-[#8ee04a] to-[#4aa510] text-white",
  marked:
    "bg-gradient-to-b from-[#8a63c7] to-[#5b3a94] text-white rounded-full",
  answeredMarked:
    "bg-gradient-to-b from-[#8a63c7] to-[#5b3a94] text-white rounded-full",
};

// One coloured badge with a number in it
function Shape({
  status,
  children,
  size,
}: {
  status: PaletteStatus;
  children: React.ReactNode;
  size: "sm" | "lg";
}) {
  return (
    <span
      style={CLIP[status]}
      className={`relative inline-flex shrink-0 items-center justify-center font-medium ${FILL[status]} ${
        size === "lg" ? "h-11 w-12 text-sm" : "h-6 w-7 text-[11px]"
      } ${status === "notAnswered" || status === "answered" ? "pb-1" : ""}`}
    >
      {children}
      {status === "answeredMarked" ? (
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-white bg-[#4aa510]" />
      ) : null}
    </span>
  );
}

const LEGEND: PaletteStatus[] = [
  "answered",
  "notAnswered",
  "notVisited",
  "marked",
  "answeredMarked",
];

type ExamPaletteProps = {
  statuses: PaletteStatus[];
  // The number written on each question (the place in the whole test). Without it the questions are 1, 2, 3 ...
  numbers?: number[];
  // The title of the blue bar: the name of the part, or "Test"
  title?: string;
  current: number;
  onSelect: (index: number) => void;
};

// The right-hand side of the exam screen: how many questions are in each state, and the question numbers
export default function ExamPalette({
  statuses,
  numbers,
  title = "Test",
  current,
  onSelect,
}: ExamPaletteProps) {
  const count = (status: PaletteStatus) =>
    statuses.filter((s) => s === status).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ul className="grid grid-cols-2 border-b border-slate-400 text-[15px]">
        {LEGEND.map((status, i) => (
          <li
            key={status}
            className={`flex items-center gap-3 border-slate-400 px-3 py-3 ${i % 2 === 0 ? "border-r" : ""} ${
              i < 4 ? "border-b" : "col-span-2"
            }`}
          >
            <Shape status={status} size="sm">
              {count(status)}
            </Shape>
            <span className="leading-tight">
              {status === "answeredMarked" ? LABEL[status] : SHORT[status]}
            </span>
          </li>
        ))}
      </ul>

      <h2 className="bg-[#4a7bc0] px-3 py-2.5 text-lg font-bold text-white">
        {title}
      </h2>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <p className="text-base font-medium">Choose a Question</p>
        <ol className="mt-3 grid grid-cols-4 gap-x-3 gap-y-3">
          {statuses.map((status, i) => (
            <li key={i} className="flex justify-center">
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => onSelect(i)}
                aria-current={i === current ? "true" : undefined}
                aria-label={`Question ${numbers?.[i] ?? i + 1}, ${SHORT[status]}`}
                className={`rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  i === current
                    ? "outline outline-2 outline-offset-2 outline-brand-950"
                    : ""
                }`}
              >
                <Shape status={status} size="lg">
                  {numbers?.[i] ?? i + 1}
                </Shape>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
