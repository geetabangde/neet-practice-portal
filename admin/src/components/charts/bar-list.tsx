import { scoreTone } from "@/lib/selectors";
import type { ChartPoint } from "@/types";
import { ProgressBar } from "@/components/ui/progress";

interface BarListProps {
  data: ChartPoint[];
  // The name used in each bar's description, e.g. "average score"
  measure: string;
  // Colour the bars green / amber / red by value. Use it for percentages.
  byScore?: boolean;
  format?: (value: number) => string;
  // The value that fills a bar completely. 100 for percentages.
  max?: number;
}

// A list of horizontal bars, one per item. Good for "score per subject".
export function BarList({ data, measure, byScore = true, format = (v) => `${v}%`, max = 100 }: BarListProps) {
  return (
    <ul className="space-y-3.5">
      {data.map((item) => (
        <li key={item.label}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-slate-700">{item.label}</span>
            <span className="font-semibold text-slate-900">{format(item.value)}</span>
          </div>
          <ProgressBar
            label={`${item.label} ${measure}`}
            value={(item.value / max) * 100}
            tone={byScore ? scoreTone(item.value) : "indigo"}
          />
        </li>
      ))}
    </ul>
  );
}
