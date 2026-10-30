"use client";

import { useState, type ReactNode } from "react";
import { MenuIcon, SearchIcon } from "./icons";
import Sidebar from "./Sidebar";

type DashboardShellProps = {
  title: string;
  children: ReactNode;
};

// Frame for every dashboard page: dark sidebar + a rounded white panel.
// The page content comes in as children, so it can stay a Server Component.
export default function DashboardShell({ title, children }: DashboardShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-950 bg-[linear-gradient(160deg,#0b4350_0%,#04202a_45%,#021419_100%)] lg:flex lg:h-screen lg:overflow-hidden">
      {menuOpen ? (
        <button
          suppressHydrationWarning
          type="button"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-brand-950 transition-transform lg:static lg:w-56 lg:shrink-0 lg:bg-transparent ${
          menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <Sidebar onClose={() => setMenuOpen(false)} />
      </aside>

      <div className="min-w-0 flex-1 p-2 sm:p-3 lg:h-screen lg:pl-0">
        <div className="flex min-h-[calc(100vh-1rem)] flex-col rounded-2xl bg-tint text-brand-950 lg:h-full lg:min-h-0 lg:rounded-3xl">
          <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="rounded-lg p-1 hover:bg-slate-200/60 lg:hidden"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
            <p className="truncate text-base font-semibold sm:text-lg">{title}</p>

            <div className="relative ml-auto w-full max-w-[16rem]">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
              <input
                suppressHydrationWarning
                type="search"
                aria-label="Search"
                placeholder="Search"
                className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none placeholder:text-slate-500 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
              />
            </div>
          </header>

          <div className="relative flex flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-6 [&>*]:shrink-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
