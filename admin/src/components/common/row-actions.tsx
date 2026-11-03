import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export interface RowAction {
  label: string;
  icon: LucideIcon;
  // A button action...
  onClick?: () => void;
  // ...or a link to another page
  href?: string;
  danger?: boolean;
}

const style =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

// The small icon buttons at the end of a table row: view, edit, delete ...
export function RowActions({ actions }: { actions: RowAction[] }) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      {actions.map(({ label, icon: Icon, onClick, href, danger }) => {
        const className = cn(
          style,
          danger ? "text-slate-400 hover:bg-red-50 hover:text-red-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700",
        );
        return href ? (
          <Link key={label} href={href} aria-label={label} title={label} className={className}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : (
          <button key={label} type="button" onClick={onClick} aria-label={label} title={label} className={className}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
