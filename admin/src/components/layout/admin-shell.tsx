"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

// The frame of every admin page: sidebar on the left, header on top, the page in the middle.
// It is used once, in the (admin) layout, so every page inside gets it without repeating code.
export function AdminShell({ children }: { children: ReactNode }) {
  // Large screens: collapse the sidebar to icons. Phones: the sidebar is a drawer.
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Esc closes the drawer on phones
  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-tint lg:flex">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-indigo-700 focus:shadow-lg"
      >
        Skip to content
      </a>

      {drawerOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] lg:hidden"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-brand-950 bg-[linear-gradient(180deg,#07313b_0%,#04202a_55%,#021419_100%)] transition-all duration-200",
          "lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:shrink-0",
          collapsed ? "lg:w-[76px]" : "lg:w-64",
          drawerOpen ? "translate-x-0" : "invisible -translate-x-full lg:visible lg:translate-x-0",
        )}
      >
        <Sidebar
          collapsed={collapsed}
          onNavigate={() => setDrawerOpen(false)}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onMenuClick={() => setDrawerOpen(true)}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((value) => !value)}
        />
        <main id="main" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
