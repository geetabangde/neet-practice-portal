import { cn } from "@/lib/cn";
import type { ChartPoint } from "@/types";
import { seriesColors } from "./chart-utils";

interface DonutChartProps {
  data: ChartPoint[];
  title: string;
  // Text in the middle of the ring: usually the total
  centerValue: string;
  centerLabel: string;
  format?: (value: number) => string;
}

const RADIUS = 15.9155; // a circle whose edge is 100 units long, so numbers are percentages

// A ring split into coloured parts, with a legend that lists every part
export function DonutChart({ data, title, centerValue, centerLabel, format = String }: DonutChartProps) {
  const total = data.reduce((sum, point) => sum + point.value, 0) || 1;

  // Where each part starts, counted around the ring: the sum of the parts before it
  const percents = data.map((point) => (point.value / total) * 100);
  const parts = data.map((point, i) => ({
    ...point,
    percent: percents[i],
    start: percents.slice(0, i).reduce((sum, p) => sum + p, 0),
    color: seriesColors[i % seriesColors.length],
  }));

  return (
    <figure className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
      <div className="relative h-44 w-44 shrink-0">
        <svg viewBox="0 0 42 42" role="img" aria-label={`${title}. ${parts.map((p) => `${p.label} ${Math.round(p.percent)}%`).join(", ")}`} className="h-full w-full -rotate-90">
          <circle cx="21" cy="21" r={RADIUS} fill="none" strokeWidth="5" className="stroke-slate-100" />
          {parts.map((part) => (
            <circle
              key={part.label}
              cx="21"
              cy="21"
              r={RADIUS}
              fill="none"
              strokeWidth="5"
              className={part.color.stroke}
              strokeDasharray={`${Math.max(part.percent - 0.8, 0)} ${100 - Math.max(part.percent - 0.8, 0)}`}
              strokeDashoffset={-part.start}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
          <span className="text-2xl font-semibold text-slate-900">{centerValue}</span>
          <span className="text-xs text-slate-500">{centerLabel}</span>
        </div>
      </div>
      <ul className="w-full max-w-xs space-y-2.5">
        {parts.map((part) => (
          <li key={part.label} className="flex items-center gap-2.5 text-sm">
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", part.color.bar)} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-slate-600">{part.label}</span>
            <span className="font-medium text-slate-900">{format(part.value)}</span>
            <span className="w-10 text-right text-xs text-slate-400">{Math.round(part.percent)}%</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
