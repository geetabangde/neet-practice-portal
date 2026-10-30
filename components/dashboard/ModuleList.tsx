"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import ProDialog from "./ProDialog";
import type { SubjectModule } from "@/types/dashboard";
import { ArrowRightIcon, ChevronDownIcon, DocIcon, LockIcon, StarIcon } from "./icons";

type SortKey = "number" | "name";
type FilterKey = "all" | "free" | "locked";

const selectClass =
  "appearance-none rounded-full border border-slate-200 bg-white py-2 pl-4 pr-9 text-xs font-medium outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

type ModuleListProps = {
  subject: string;
  modules: SubjectModule[];
};

export default function ModuleList({ subject, modules }: ModuleListProps) {
  const [sort, setSort] = useState<SortKey>("number");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [proOpen, setProOpen] = useState(false);

  // The number badge keeps the original position, even after sorting or filtering
  const numbered = modules.map((module, index) => ({ module, number: index + 1 }));
  const visible = numbered
    .filter(({ module }) => filter === "all" || (filter === "locked") === module.locked)
    .sort((a, b) => (sort === "name" ? a.module.title.localeCompare(b.module.title) : a.number - b.number));

  return (
    <>
      <div className="flex gap-3 sm:absolute sm:right-0 sm:top-0">
        <label className="relative">
          <span className="sr-only">Sort modules</span>
          <select
            suppressHydrationWarning
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className={selectClass}
          >
            <option value="number">Sort by : Module no.</option>
            <option value="name">Sort by : Name</option>
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        </label>
        <label className="relative">
          <span className="sr-only">Filter modules</span>
          <select
            suppressHydrationWarning
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterKey)}
            className={selectClass}
          >
            <option value="all">All</option>
            <option value="free">Free</option>
            <option value="locked">Locked</option>
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        </label>
      </div>

      {visible.length > 0 ? (
        <ul className="mt-5 space-y-3 sm:mt-8">
          {visible.map(({ module, number }) => (
            <li
              key={module.title}
              className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-2.5 sm:flex-nowrap sm:gap-4"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-accent text-[11px] font-medium text-white">
                {number}
              </span>
              <div className="flex h-16 w-[105px] shrink-0 items-center justify-center rounded-lg bg-accent-soft p-1.5">
                <Image
                  src={`/modules/${module.image}.png`}
                  alt=""
                  width={320}
                  height={200}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1 basis-40">
                <h3 className="text-base font-semibold leading-snug">{module.title}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-black/80">
                  <DocIcon className="h-3.5 w-3.5" />
                  {module.mcqs} MCQs
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-black/80">
                  <StarIcon className="h-3.5 w-3.5 text-[#ffc107]" />
                  ({module.rating})
                </p>
              </div>
              <div className="ml-auto flex shrink-0 flex-col items-end gap-3 self-stretch justify-between">
                {module.locked ? (
                  <span className="inline-flex items-center gap-1 rounded bg-black px-2 py-0.5 text-[10px] font-semibold text-white">
                    <LockIcon className="h-3 w-3" />
                    GET
                  </span>
                ) : (
                  <span aria-hidden="true" />
                )}
                {module.locked ? (
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={() => setProOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-xs font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    Start Module
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                ) : (
                  <Link
                    href={`/dashboard/${subject}/modules/${module.slug}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-xs font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    Start Module
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-xl bg-white p-6 text-sm text-slate-600">No modules match this filter.</p>
      )}
      <ProDialog open={proOpen} onClose={() => setProOpen(false)} />
    </>
  );
}
