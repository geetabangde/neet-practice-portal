import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  // Right-align numbers, for example
  align?: "left" | "right" | "center";
  // The main column of a row. On phones it becomes the title of the row's card.
  primary?: boolean;
  // Leave the column out on phones (for less important details)
  hideOnMobile?: boolean;
  // Also leave it out on tablets: it appears from this screen size up (lg = laptop, xl = wide desktop)
  hideBelow?: "lg" | "xl";
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  // Describes the table for screen readers
  caption: string;
  // Shown at the end of each row: buttons or a menu
  actions?: (row: T) => ReactNode;
  // Shown instead of the table when there are no rows
  empty?: ReactNode;
}

const alignClass = { left: "text-left", right: "text-right", center: "text-center" };
const hideBelowClass = { lg: "hidden lg:table-cell", xl: "hidden xl:table-cell" };

// One table for the whole panel. On medium screens and up it is a real table;
// on phones every row becomes a small card, so nothing needs sideways scrolling.
export function DataTable<T>({ columns, rows, getRowId, caption, actions, empty }: DataTableProps<T>) {
  if (rows.length === 0 && empty) return <>{empty}</>;

  const primary = columns.find((column) => column.primary) ?? columns[0];
  const others = columns.filter((column) => column !== primary && !column.hideOnMobile);

  return (
    <>
      {/* Tablet and desktop */}
      {/* "relative" keeps the screen-reader-only labels inside this box, so they cannot widen the page */}
      <div className="relative hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-y border-slate-200 bg-slate-50/70">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500",
                    alignClass[column.align ?? "left"],
                    column.hideBelow && hideBelowClass[column.hideBelow],
                  )}
                >
                  {column.header}
                </th>
              ))}
              {actions ? (
                <th scope="col" className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span className="sr-only">Actions</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={getRowId(row)} className="transition-colors hover:bg-slate-50/70">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-5 py-3.5 align-middle text-slate-700",
                      alignClass[column.align ?? "left"],
                      column.hideBelow && hideBelowClass[column.hideBelow],
                      column.className,
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
                {actions ? <td className="px-5 py-3.5 text-right align-middle">{actions(row)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phones */}
      <ul className="divide-y divide-slate-100 md:hidden" aria-label={caption}>
        {rows.map((row) => (
          <li key={getRowId(row)} className="space-y-3 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">{primary.cell(row)}</div>
              {actions ? <div className="shrink-0">{actions(row)}</div> : null}
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {others.map((column) => (
                <div key={column.key} className="min-w-0">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{column.header}</dt>
                  <dd className="mt-0.5 text-sm text-slate-700">{column.cell(row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
