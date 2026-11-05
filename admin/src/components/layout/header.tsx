"use client";

import { ChevronDown, ChevronRight, LogOut, Menu, PanelLeftClose, PanelLeftOpen, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Avatar } from "@/components/ui/avatar";
import { Dropdown, MenuLink, MenuSeparator } from "@/components/ui/dropdown";
import { IconButton } from "@/components/ui/button";
import { breadcrumbsFor, pageTitleFor } from "@/lib/nav";
import { GlobalSearch } from "./global-search";

// Where the student site runs. Set NEXT_PUBLIC_STUDENT_SITE_URL to change it.
const STUDENT_SITE_URL = process.env.NEXT_PUBLIC_STUDENT_SITE_URL ?? "http://localhost:3000";

// "admin" -> "Admin"
export function roleLabel(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, " ");
}

function ProfileMenu() {
  const { admin, logout } = useAuth();
  return (
    <Dropdown
      ariaLabel="Open profile menu"
      buttonClassName="flex items-center gap-3 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      label={
        <>
          <Avatar name={admin.name} size="sm" />
          <span className="hidden text-left leading-tight md:block">
            <span className="block text-sm font-medium text-slate-900">{admin.name}</span>
            <span className="block text-xs text-slate-500">{roleLabel(admin.role)}</span>
          </span>
          <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" aria-hidden="true" />
        </>
      }
    >
      <div className="px-3 py-2.5">
        <p className="text-sm font-semibold text-slate-900">{admin.name}</p>
        <p className="text-xs text-slate-500">{admin.email}</p>
      </div>
      <MenuSeparator />
      <MenuLink href="/settings" icon={<User className="h-4 w-4 text-slate-400" aria-hidden="true" />}>
        My profile
      </MenuLink>
      <MenuLink href={STUDENT_SITE_URL}>View student site</MenuLink>
      <MenuSeparator />
      <MenuLink href="/login" onClick={logout} icon={<LogOut className="h-4 w-4" aria-hidden="true" />}>
        <span className="text-red-600">Logout</span>
      </MenuLink>
    </Dropdown>
  );
}

interface HeaderProps {
  onMenuClick: () => void;
  // Collapse / expand the sidebar (large screens)
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Header({ onMenuClick, collapsed, onToggleCollapse }: HeaderProps) {
  const pathname = usePathname();
  const crumbs = breadcrumbsFor(pathname);
  const title = pageTitleFor(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <IconButton label="Open menu" onClick={onMenuClick} className="lg:hidden">
          <Menu className="h-5 w-5" />
        </IconButton>

        <IconButton
          label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
          onClick={onToggleCollapse}
          className="hidden lg:inline-flex"
        >
          {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </IconButton>

        <div className="min-w-0 flex-1 lg:flex-none">
          <nav aria-label="Breadcrumb" className="hidden text-xs sm:block">
            <ol className="flex items-center gap-1 text-slate-400">
              {crumbs.map((crumb, index) => (
                <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                  {index > 0 ? <ChevronRight className="h-3 w-3" aria-hidden="true" /> : null}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-slate-700">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="font-medium text-slate-600">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          <p className="truncate text-base font-semibold text-slate-900 sm:mt-0.5 sm:text-lg">{title}</p>
        </div>

        <GlobalSearch className="mx-auto hidden w-full max-w-md lg:block" />

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <ProfileMenu />
        </div>
      </div>
      <div className="px-4 pb-3 sm:px-6 lg:hidden">
        <GlobalSearch />
      </div>
    </header>
  );
}
