"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { dashboardSubjects } from "@/data/dashboard";
import type { BookmarkItem } from "@/types/dashboard";
import { ArrowRightIcon, BookmarkIcon, ChevronDownIcon } from "./icons";

type SortKey = "newest" | "oldest";

const selectClass =
  "appearance-none rounded-full border border-slate-200 bg-white py-2 pl-4 pr-9 text-xs font-medium outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

function subjectOf(slug: string) {
  return dashboardSubjects.find((s) => s.slug === slug);
}

export default function BookmarkList({ bookmarks }: { bookmarks: BookmarkItem[] }) {
  const [sort, setSort] = useState<SortKey>("newest");
  const [subjectFilter, setSubjectFilter] = useState("all");

  // Number badges keep the original (newest-first) position
  const numbered = bookmarks.map((bookmark, index) => ({ bookmark, number: index + 1 }));
  const visible = numbered
    .filter(({ bookmark }) => subjectFilter === "all" || bookmark.subjectSlug === subjectFilter)
    .sort((a, b) => (sort === "newest" ? a.number - b.number : b.number - a.number));

  // Only subjects that have a bookmark are offered in the filter
  const subjectOptions = dashboardSubjects.filter((s) => bookmarks.some((b) => b.subjectSlug === s.slug));

  return (
    <>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bookmarks</h1>
          <p className="mt-1 text-xs font-semibold uppercase">Total : {bookmarks.length}</p>
        </div>
        <div className="flex gap-3">
          <label className="relative">
            <span className="sr-only">Sort bookmarks</span>
            <select
              suppressHydrationWarning
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className={selectClass}
            >
              <option value="newest">Sort by : Newest First</option>
              <option value="oldest">Sort by : Oldest First</option>
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          </label>
          <label className="relative">
            <span className="sr-only">Filter by subject</span>
            <select
              suppressHydrationWarning
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className={selectClass}
            >
              <option value="all">All</option>
              {subjectOptions.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          </label>
        </div>
      </div>

      {visible.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {visible.map(({ bookmark, number }) => {
            const subject = subjectOf(bookmark.subjectSlug);
            if (!subject) return null;
            const href = `/dashboard/bookmarks/${bookmark.slug}`;
            return (
              <li
                key={bookmark.title}
                className="flex items-center gap-3 rounded-xl bg-white p-2.5 sm:gap-4"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-accent text-[11px] font-medium text-white">
                  {number}
                </span>
                {/* The subject icon stands in until each bookmark has its own picture */}
                <div className="flex h-16 w-[105px] shrink-0 items-center justify-center rounded-lg bg-accent-soft p-1.5">
                  <Image
                    src={`/subjects/${subject.icon}.png`}
                    alt=""
                    width={80}
                    height={80}
                    className="h-12 w-12 object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-medium ${bookmark.labelClass}`}>{subject.name}</p>
                  <h3 className="text-base font-semibold leading-snug">{bookmark.title}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-black/80">
                    <BookmarkIcon className="h-3.5 w-3.5 fill-current" />
                    {bookmark.mcqs} MCQs
                  </p>
                </div>
                <Link
                  href={href}
                  aria-label={`Open ${bookmark.title}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-5 rounded-xl bg-white p-6 text-sm text-slate-600">No bookmarks match this filter.</p>
      )}
    </>
  );
}
