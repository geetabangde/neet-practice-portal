"use client";

import { cn } from "@/lib/cn";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  // A small number after the label, e.g. how many items are in the tab
  count?: number;
}

interface TabsProps<T extends string> {
  tabs: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  // "pills" is a segmented control; "underline" is a classic tab bar
  variant?: "pills" | "underline";
  className?: string;
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
  variant = "pills",
  className,
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        variant === "pills"
          ? "inline-flex max-w-full gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1"
          : "flex max-w-full gap-6 overflow-x-auto border-b border-slate-200",
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              variant === "pills"
                ? cn(
                    "rounded-md px-3 py-1.5",
                    active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800",
                  )
                : cn(
                    "-mb-px border-b-2 px-1 pb-3 pt-1",
                    active
                      ? "border-indigo-600 text-indigo-700"
                      : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800",
                  ),
            )}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs",
                  active ? "bg-indigo-50 text-indigo-700" : "bg-slate-200/70 text-slate-600",
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
