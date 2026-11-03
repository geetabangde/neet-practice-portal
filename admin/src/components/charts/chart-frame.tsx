import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ChartFrameProps {
  // Gridline values from 0 to the top
  ticks: number[];
  formatTick: (value: number) => string;
  // The labels under the chart, one per point
  xLabels: string[];
  height?: number;
  // Where the labels sit: "between" for points on the edges (line charts), "center" for bars
  labelAlign?: "between" | "center";
  children: ReactNode;
}

// The grid, the y-axis numbers and the x-axis labels around a chart. The labels are real HTML
// text, so they stay sharp and readable at every screen width.
export function ChartFrame({
  ticks,
  formatTick,
  xLabels,
  height = 240,
  labelAlign = "center",
  children,
}: ChartFrameProps) {
  const top = ticks[ticks.length - 1] || 1;

  return (
    <div>
      <div className="flex">
        <div className="relative w-12 shrink-0" style={{ height }} aria-hidden="true">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-2 translate-y-1/2 text-xs text-slate-400"
              style={{ bottom: `${(tick / top) * 100}%` }}
            >
              {formatTick(tick)}
            </span>
          ))}
        </div>
        <div className="relative flex-1" style={{ height }}>
          {ticks.map((tick) => (
            <div
              key={tick}
              aria-hidden="true"
              className={cn("absolute inset-x-0 border-t", tick === 0 ? "border-slate-200" : "border-dashed border-slate-100")}
              style={{ bottom: `${(tick / top) * 100}%` }}
            />
          ))}
          {children}
        </div>
      </div>
      <div
        aria-hidden="true"
        className={cn("mt-2 flex pl-12 text-xs text-slate-400", labelAlign === "between" ? "justify-between" : "")}
      >
        {xLabels.map((label, i) => (
          <span
            key={`${label}-${i}`}
            // On small screens only every second label is shown, so they do not collide
            className={cn(labelAlign === "center" && "flex-1 text-center", i % 2 === 1 && "hidden sm:inline")}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
