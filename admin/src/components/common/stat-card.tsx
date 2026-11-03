import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

const iconTones = {
  indigo: "bg-indigo-50 text-indigo-600",
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
  rose: "bg-rose-50 text-rose-600",
};

interface StatCardProps {
  label: string;
  // Already formatted, e.g. "1,248" or "₹4.2L"
  value: string;
  icon: LucideIcon;
  tone?: keyof typeof iconTones;
  // Change compared with the previous period, in percent
  change?: number;
  comparison?: string;
}

export function StatCard({ label, value, icon: Icon, tone = "indigo", change, comparison }: StatCardProps) {
  const up = change !== undefined && change >= 0;
  const TrendIcon = up ? TrendingUp : TrendingDown;

  return (
    <Card className="p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 truncate text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
        </div>
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", iconTones[tone])}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      {change !== undefined ? (
        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">{up ? "Up" : "Down"} </span>
            {Math.abs(change)}%
          </span>
          {comparison ? <span className="text-slate-500">{comparison}</span> : null}
        </p>
      ) : null}
    </Card>
  );
}
