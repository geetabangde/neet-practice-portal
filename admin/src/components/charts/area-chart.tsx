"use client";

import { useId, useState, type PointerEvent } from "react";
import type { ChartPoint } from "@/types";
import { ChartFrame } from "./chart-frame";
import { maxOf, niceMax, summarize, ticksFor } from "./chart-utils";

interface AreaChartProps {
  data: ChartPoint[];
  // A short description of the chart, also read by screen readers
  title: string;
  format?: (value: number) => string;
  formatTick?: (value: number) => string;
  height?: number;
}

const plain = (value: number) => String(value);

// A smooth line with a soft fill below it. Point the mouse (or finger) at it to see the values.
export function AreaChart({ data, title, format = plain, formatTick = format, height = 240 }: AreaChartProps) {
  const gradientId = useId();
  const [active, setActive] = useState<number | null>(null);

  const top = niceMax(maxOf(data));
  const last = Math.max(data.length - 1, 1);
  const points = data.map((point, i) => ({ x: (i / last) * 100, y: 100 - (point.value / top) * 100 }));

  // Each step is a curve that leaves and arrives horizontally, which gives a smooth line
  const line = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const mid = (prev.x + p.x) / 2;
      return `C ${mid} ${prev.y}, ${mid} ${p.y}, ${p.x} ${p.y}`;
    })
    .join(" ");
  const area = `${line} L 100 100 L 0 100 Z`;

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - box.left) / box.width;
    setActive(Math.max(0, Math.min(data.length - 1, Math.round(ratio * last))));
  }

  const activePoint = active === null ? null : points[active];

  return (
    <figure>
      <ChartFrame
        ticks={ticksFor(top)}
        formatTick={formatTick}
        xLabels={data.map((p) => p.label)}
        height={height}
        labelAlign="between"
      >
        <div
          role="img"
          aria-label={summarize(title, data, format)}
          className="absolute inset-0 touch-pan-y"
          onPointerMove={onPointerMove}
          onPointerLeave={() => setActive(null)}
        >
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0cc1e0" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0cc1e0" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gradientId})`} />
            <path
              d={line}
              fill="none"
              stroke="#0cc1e0"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {activePoint && active !== null ? (
            <>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 border-l border-dashed border-indigo-300"
                style={{ left: `${activePoint.x}%` }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-indigo-600 shadow"
                style={{ left: `${activePoint.x}%`, top: `${activePoint.y}%` }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
                style={{
                  left: `${Math.min(88, Math.max(12, activePoint.x))}%`,
                  top: `${Math.max(activePoint.y, 18)}%`,
                  marginTop: -10,
                }}
              >
                <span className="text-slate-300">{data[active].label}</span>
                <span className="ml-2 font-semibold">{format(data[active].value)}</span>
              </div>
            </>
          ) : null}
        </div>
      </ChartFrame>

      {/* The same numbers as a table, for screen readers */}
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {data.map((p) => (
            <tr key={p.label}>
              <th scope="row">{p.label}</th>
              <td>{format(p.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
