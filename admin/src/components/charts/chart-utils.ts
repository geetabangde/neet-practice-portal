import type { ChartPoint } from "@/types";

// A round top value for four gridlines whose numbers are all easy to read:
// 83 -> 100 (0, 25, 50, 75, 100) and 203 -> 240 (0, 60, 120, 180, 240)
export function niceMax(max: number): number {
  if (max <= 0) return 4;
  const rawStep = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const fraction = rawStep / magnitude;
  const niceFraction = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((candidate) => fraction <= candidate) ?? 10;
  return niceFraction * magnitude * 4;
}

// Gridline values from 0 to the top, e.g. [0, 25, 50, 75, 100]
export function ticksFor(top: number, count = 4): number[] {
  return Array.from({ length: count + 1 }, (_, i) => (top / count) * i);
}

export function maxOf(points: ChartPoint[]): number {
  return points.reduce((max, point) => Math.max(max, point.value), 0);
}

// Used for the text a screen reader gets instead of the picture
export function summarize(title: string, points: ChartPoint[], format: (value: number) => string): string {
  if (points.length === 0) return `${title}: no data`;
  const highest = points.reduce((best, point) => (point.value > best.value ? point : best));
  return `${title}. ${points.length} points from ${points[0].label} to ${points[points.length - 1].label}. Highest: ${format(highest.value)} at ${highest.label}.`;
}

// The colours the charts use, as Tailwind classes
export const seriesColors = [
  { bar: "bg-indigo-500", fill: "fill-indigo-500", stroke: "stroke-indigo-500", text: "text-indigo-600", hex: "#6366f1" },
  { bar: "bg-sky-400", fill: "fill-sky-400", stroke: "stroke-sky-400", text: "text-sky-600", hex: "#38bdf8" },
  { bar: "bg-violet-400", fill: "fill-violet-400", stroke: "stroke-violet-400", text: "text-violet-600", hex: "#a78bfa" },
  { bar: "bg-emerald-400", fill: "fill-emerald-400", stroke: "stroke-emerald-400", text: "text-emerald-600", hex: "#34d399" },
  { bar: "bg-amber-400", fill: "fill-amber-400", stroke: "stroke-amber-400", text: "text-amber-600", hex: "#fbbf24" },
] as const;
