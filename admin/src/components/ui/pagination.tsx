"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  from: number;
  to: number;
  total: number;
  // What the items are called, e.g. "students"
  noun: string;
}

// 1 ... 4 5 6 ... 12: the first page, the last page and the pages around the current one
function pageNumbers(page: number, pageCount: number): (number | "gap-start" | "gap-end")[] {
  const wanted = new Set([1, pageCount, page - 1, page, page + 1]);
  const pages = [...wanted].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const result: (number | "gap-start" | "gap-end")[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) result.push(i === 1 ? "gap-start" : "gap-end");
    result.push(p);
  });
  return result;
}

const buttonBase =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40";

export function Pagination({ page, pageCount, onPageChange, from, to, total, noun }: PaginationProps) {
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-5 py-3.5 sm:flex-row">
      <p className="text-sm text-slate-500" aria-live="polite">
        {total === 0 ? (
          `No ${noun}`
        ) : (
          <>
            Showing <span className="font-medium text-slate-700">{from}</span> to{" "}
            <span className="font-medium text-slate-700">{to}</span> of{" "}
            <span className="font-medium text-slate-700">{total}</span> {noun}
          </>
        )}
      </p>
      {pageCount > 1 ? (
        <nav aria-label={`${noun} pages`} className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
            className={cn(buttonBase, "text-slate-600 hover:bg-slate-100")}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pageNumbers(page, pageCount).map((item) =>
            typeof item === "number" ? (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === page ? "page" : undefined}
                className={cn(
                  buttonBase,
                  item === page ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100",
                )}
              >
                {item}
              </button>
            ) : (
              <span key={item} className="px-1 text-slate-400" aria-hidden="true">
                …
              </span>
            ),
          )}
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page === pageCount}
            aria-label="Next page"
            className={cn(buttonBase, "text-slate-600 hover:bg-slate-100")}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      ) : null}
    </div>
  );
}
