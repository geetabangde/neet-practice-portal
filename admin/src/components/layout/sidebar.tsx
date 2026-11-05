"use client";

import { LogOut, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/cn";
import { activeNavHref, NAV_GROUPS } from "@/lib/nav";

interface SidebarProps {
  // Icons only. Used on large screens when the admin collapses the sidebar.
  collapsed: boolean;
  // Closes the sidebar drawer on phones (after choosing a page, or with the X)
  onNavigate: () => void;
}

// Dark teal sidebar, like the student dashboard
export function Sidebar({ collapsed, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const activeHref = activeNavHref(pathname);

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className={cn("flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4", collapsed && "lg:justify-center lg:px-0")}>
        <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-2.5" aria-label="HN QBank Admin, go to dashboard">
          <Image src="/logo.png" alt="" width={342} height={240} priority className="h-10 w-auto shrink-0" />
          <span className={cn("leading-tight", collapsed && "lg:hidden")}>
            <span className="block text-sm font-semibold text-white">HN QBank</span>
            <span className="block text-xs text-white/60">Admin Console</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={onNavigate}
          aria-label="Close menu"
          className="ml-auto rounded-lg p-2 text-white/70 hover:bg-white/10 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Menu */}
      <nav aria-label="Main" className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className={cn("mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-white/50", collapsed && "lg:hidden")}>
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
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                        active ? "bg-indigo-500/20 text-white" : "text-white/75 hover:bg-white/10 hover:text-white",
                        collapsed && "lg:justify-center lg:px-0",
                      )}
                    >
                      {active ? (
                        <span aria-hidden="true" className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-indigo-400" />
                      ) : null}
                      <Icon className={cn("h-5 w-5 shrink-0", active ? "text-indigo-400" : "text-white/55 group-hover:text-white")} aria-hidden="true" />
                      <span className={cn(collapsed && "lg:sr-only")}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom: logout */}
      <div className="shrink-0 space-y-1 border-t border-white/10 p-3">
        <Link
          href="/login"
          onClick={() => {
            logout();
            onNavigate();
          }}
          title={collapsed ? "Logout" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300",
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
