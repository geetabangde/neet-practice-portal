import { cn } from "@/lib/cn";

const fills = {
  indigo: "bg-indigo-500",
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
};

interface ProgressBarProps {
  // 0 to 100
  value: number;
  tone?: keyof typeof fills;
  label: string;
  className?: string;
}

export function ProgressBar({ value, tone = "indigo", label, className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-100", className)}
    >
      <div className={cn("h-full rounded-full transition-all", fills[tone])} style={{ width: `${clamped}%` }} />
    </div>
  );
}
