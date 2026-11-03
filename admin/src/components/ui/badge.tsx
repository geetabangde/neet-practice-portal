import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "slate" | "indigo" | "blue" | "green" | "amber" | "red" | "violet";

const tones: Record<BadgeTone, { badge: string; dot: string }> = {
  slate: { badge: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400" },
  indigo: { badge: "bg-indigo-50 text-indigo-700 ring-indigo-200", dot: "bg-indigo-500" },
  blue: { badge: "bg-blue-50 text-blue-700 ring-blue-200", dot: "bg-blue-500" },
  green: { badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  amber: { badge: "bg-amber-50 text-amber-800 ring-amber-200", dot: "bg-amber-500" },
  red: { badge: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500" },
  violet: { badge: "bg-violet-50 text-violet-700 ring-violet-200", dot: "bg-violet-500" },
};

interface BadgeProps {
  tone?: BadgeTone;
  // A small coloured dot before the text
  dot?: boolean;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = "slate", dot = false, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone].badge,
        className,
      )}
    >
      {dot ? <span className={cn("h-1.5 w-1.5 rounded-full", tones[tone].dot)} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
