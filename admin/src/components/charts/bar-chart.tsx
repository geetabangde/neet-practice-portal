import type { ChartPoint, StackedPoint } from "@/types";
import { cn } from "@/lib/cn";
import { ChartFrame } from "./chart-frame";
import { maxOf, niceMax, seriesColors, summarize, ticksFor } from "./chart-utils";

const plain = (value: number) => String(value);

interface BarChartProps {
  data: ChartPoint[];
  title: string;
  format?: (value: number) => string;
  formatTick?: (value: number) => string;
  height?: number;
  // Index into the chart colours
  colorIndex?: number;
}

// Vertical bars. Each bar shows its value when hovered or focused.
export function BarChart({
  data,
  title,
  format = plain,
  formatTick = format,
  height = 240,
  colorIndex = 0,
}: BarChartProps) {
  const top = niceMax(maxOf(data));
  const color = seriesColors[colorIndex % seriesColors.length];

  return (
    <figure>
      <ChartFrame ticks={ticksFor(top)} formatTick={formatTick} xLabels={data.map((p) => p.label)} height={height}>
        <ul role="list" aria-label={summarize(title, data, format)} className="absolute inset-0 flex items-end gap-1.5 px-1 sm:gap-2.5">
          {data.map((point) => (
            <li key={point.label} className="group relative flex h-full flex-1 items-end justify-center">
              <div
                tabIndex={0}
                aria-label={`${point.label}: ${format(point.value)}`}
                className={cn(
                  "w-full max-w-10 rounded-t-md opacity-90 transition group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                  color.bar,
                )}
                style={{ height: `${(point.value / top) * 100}%` }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-xs font-semibold text-white shadow-lg group-focus-within:block group-hover:block"
                style={{ bottom: `calc(${(point.value / top) * 100}% + 8px)` }}
              >
                {format(point.value)}
              </span>
            </li>
          ))}
        </ul>
      </ChartFrame>
    </figure>
  );
}

interface StackedBarChartProps {
  data: StackedPoint[];
  // One name per number in `values`, e.g. ["Completed", "Not finished"]
  seriesNames: string[];
  title: string;
  height?: number;
}

// Bars made of coloured parts, e.g. completed and not-finished attempts per week
export function StackedBarChart({ data, seriesNames, title, height = 240 }: StackedBarChartProps) {
  const totals = data.map((point) => point.values.reduce((sum, v) => sum + v, 0));
  const top = niceMax(Math.max(...totals, 1));

  return (
    <figure>
      <ChartFrame
        ticks={ticksFor(top)}
        formatTick={plain}
        xLabels={data.map((p) => p.label)}
        height={height}
      >
        <ul role="list" aria-label={title} className="absolute inset-0 flex items-end gap-1.5 px-1 sm:gap-2.5">
          {data.map((point, index) => {
            const detail = point.values.map((v, i) => `${seriesNames[i]}: ${v}`).join(", ");
            return (
              <li key={point.label} className="group relative flex h-full flex-1 items-end justify-center">
                <div
                  tabIndex={0}
                  aria-label={`${point.label}. ${detail}`}
                  className="flex w-full max-w-10 flex-col-reverse overflow-hidden rounded-t-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  style={{ height: `${(totals[index] / top) * 100}%` }}
                >
                  {point.values.map((value, i) => (
                    <div
                      key={seriesNames[i]}
                      className={seriesColors[i % seriesColors.length].bar}
                      style={{ height: `${(value / totals[index]) * 100}%` }}
                    />
                  ))}
                </div>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-xs text-white shadow-lg group-focus-within:block group-hover:block"
                  style={{ bottom: `calc(${(totals[index] / top) * 100}% + 8px)` }}
                >
                  {detail}
                </span>
              </li>
            );
          })}
        </ul>
      </ChartFrame>
      <ChartLegend names={seriesNames} />
    </figure>
  );
}

export function ChartLegend({ names, className }: { names: string[]; className?: string }) {
  return (
    <ul className={cn("mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-slate-600", className)}>
      {names.map((name, i) => (
        <li key={name} className="flex items-center gap-1.5">
          <span className={cn("h-2.5 w-2.5 rounded-sm", seriesColors[i % seriesColors.length].bar)} aria-hidden="true" />
          {name}
        </li>
      ))}
    </ul>
  );
}
