"use client";

import { GraduationCap, LogOut, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { activeNavHref, NAV_GROUPS } from "@/lib/nav";

interface SidebarProps {
  // Icons only. Used on large screens when the admin collapses the sidebar.
  collapsed: boolean;
  onToggleCollapse: () => void;
  // Closes the sidebar drawer on phones (after choosing a page, or with the X)
  onNavigate: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const activeHref = activeNavHref(pathname);

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className={cn("flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 px-4", collapsed && "lg:justify-center lg:px-0")}>
        <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-3" aria-label="NEET PG Admin, go to dashboard">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-blue-600 text-white shadow-sm">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className={cn("leading-tight", collapsed && "lg:hidden")}>
            <span className="block text-sm font-semibold text-slate-900">NEET PG</span>
            <span className="block text-xs text-slate-500">Admin Console</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={onNavigate}
          aria-label="Close menu"
          className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Menu */}
      <nav aria-label="Main" className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className={cn("mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400", collapsed && "lg:hidden")}>
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.href === activeHref;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                        active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                        collapsed && "lg:justify-center lg:px-0",
                      )}
                    >
                      {active ? (
                        <span aria-hidden="true" className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-indigo-600" />
                      ) : null}
                      <Icon className={cn("h-5 w-5 shrink-0", active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} aria-hidden="true" />
                      <span className={cn(collapsed && "lg:sr-only")}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom: collapse and logout */}
      <div className="shrink-0 space-y-1 border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-pressed={collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "hidden w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 lg:flex",
            collapsed && "lg:justify-center lg:px-0",
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
          )}
          <span className={cn(collapsed && "lg:sr-only")}>{collapsed ? "Expand sidebar" : "Collapse sidebar"}</span>
        </button>
        <Link
          href="/login"
          onClick={onNavigate}
          title={collapsed ? "Logout" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
            collapsed && "lg:justify-center lg:px-0",
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className={cn(collapsed && "lg:sr-only")}>Logout</span>
        </Link>
      </div>
    </div>
  );
}
