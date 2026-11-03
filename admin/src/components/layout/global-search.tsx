"use client";

import { BookOpen, ClipboardList, FileQuestion, Search, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useDismiss } from "@/hooks/use-dismiss";
import { cn } from "@/lib/cn";

interface SearchHit {
  id: string;
  group: string;
  title: string;
  detail: string;
  href: string;
  icon: LucideIcon;
}

const MAX_HITS = 8;

// The search box in the header. It looks through students, subjects, questions and tests
// and links straight to what it finds.
export function GlobalSearch({ className }: { className?: string }) {
  const router = useRouter();
  const { students, subjects, questions, tests } = useAdminStore();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useDismiss(ref, open, () => setOpen(false));

  const hits = useMemo<SearchHit[]>(() => {
    const term = query.trim().toLowerCase();
    if (term.length < 2) return [];
    const has = (...texts: string[]) => texts.some((text) => text.toLowerCase().includes(term));

    return [
      ...students.items
        .filter((s) => has(s.name, s.email, s.phone))
        .map((s) => ({ id: s.id, group: "Students", title: s.name, detail: s.email, href: `/students/${s.id}`, icon: Users })),
      ...subjects.items
        .filter((s) => has(s.name))
        .map((s) => ({ id: s.id, group: "Subjects", title: s.name, detail: "Subject", href: "/subjects", icon: BookOpen })),
      ...questions.items
        .filter((q) => has(q.text, q.id))
        .map((q) => ({ id: q.id, group: "Questions", title: q.text, detail: q.id, href: `/questions/${q.id}/edit`, icon: FileQuestion })),
      ...tests.items
        .filter((t) => has(t.title))
        .map((t) => ({ id: t.id, group: "Tests", title: t.title, detail: t.status, href: `/tests/${t.id}/edit`, icon: ClipboardList })),
    ].slice(0, MAX_HITS);
  }, [query, students.items, subjects.items, questions.items, tests.items]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && hits[0]) go(hits[0].href);
        }}
        placeholder="Search students, questions, tests…"
        aria-label="Search students, subjects, questions and tests"
        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition [&::-webkit-search-cancel-button]:hidden focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100"
      />

      <p className="sr-only" aria-live="polite">
        {open && query.trim().length >= 2 ? `${hits.length} results` : ""}
      </p>

      {open && query.trim().length >= 2 ? (
        <div className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {hits.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              Nothing found for &ldquo;{query.trim()}&rdquo;
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1.5">
              {hits.map((hit) => {
                const Icon = hit.icon;
                return (
                  <li key={`${hit.group}-${hit.id}`}>
                    <Link
                      href={hit.href}
                      onClick={() => go(hit.href)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-900">{hit.title}</span>
                        <span className="block truncate text-xs text-slate-500">
                          {hit.group} · {hit.detail}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
