"use client";

import { Bell, ChevronDown, ChevronRight, LogOut, Menu, Settings, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { Avatar } from "@/components/ui/avatar";
import { Dropdown, MenuLink, MenuSeparator } from "@/components/ui/dropdown";
import { IconButton } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { breadcrumbsFor, pageTitleFor } from "@/lib/nav";
import { GlobalSearch } from "./global-search";

// Where the student site runs. Set NEXT_PUBLIC_STUDENT_SITE_URL to change it.
const STUDENT_SITE_URL = process.env.NEXT_PUBLIC_STUDENT_SITE_URL ?? "http://localhost:3000";

export const ADMIN_PROFILE = {
  name: "Anita Rao",
  role: "Super Admin",
  email: "anita.rao@example.com",
};

function NotificationMenu() {
  const { notifications } = useAdminStore();
  const [read, setRead] = useState(false);

  // The latest three messages are the "new" ones in this demo
  const latest = notifications.items.slice(0, 3);
  const unread = read ? 0 : latest.length;

  return (
    <Dropdown
      ariaLabel={unread > 0 ? `Notifications, ${unread} new` : "Notifications"}
      buttonClassName="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      panelClassName="w-80 !p-0"
      label={
        <>
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unread > 0 ? (
            <span
              aria-hidden="true"
              className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white"
            >
              {unread}
            </span>
          ) : null}
        </>
      }
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Notifications</p>
        <button
          type="button"
          onClick={() => setRead(true)}
          disabled={unread === 0}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:text-slate-400"
        >
          Mark all as read
        </button>
      </div>
      <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
        {latest.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-slate-500">You are all caught up.</li>
        ) : (
          latest.map((item) => (
            <li key={item.id} className="px-4 py-3">
              <p className="text-sm font-medium text-slate-900">{item.title}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{item.message}</p>
              <p className="mt-1 text-xs text-slate-400">{formatDate(item.sendAt)}</p>
            </li>
          ))
        )}
      </ul>
      <div className="border-t border-slate-100 p-2">
        <MenuLink href="/notifications">View all notifications</MenuLink>
      </div>
    </Dropdown>
  );
}

function ProfileMenu() {
  return (
    <Dropdown
      ariaLabel="Open profile menu"
      buttonClassName="flex items-center gap-3 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      label={
        <>
          <Avatar name={ADMIN_PROFILE.name} size="sm" />
          <span className="hidden text-left leading-tight md:block">
            <span className="block text-sm font-medium text-slate-900">{ADMIN_PROFILE.name}</span>
            <span className="block text-xs text-slate-500">{ADMIN_PROFILE.role}</span>
          </span>
          <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" aria-hidden="true" />
        </>
      }
    >
      <div className="px-3 py-2.5">
        <p className="text-sm font-semibold text-slate-900">{ADMIN_PROFILE.name}</p>
        <p className="text-xs text-slate-500">{ADMIN_PROFILE.email}</p>
      </div>
      <MenuSeparator />
      <MenuLink href="/settings" icon={<User className="h-4 w-4 text-slate-400" aria-hidden="true" />}>
        My profile
      </MenuLink>
      <MenuLink href="/settings" icon={<Settings className="h-4 w-4 text-slate-400" aria-hidden="true" />}>
        Settings
      </MenuLink>
      <MenuLink href={STUDENT_SITE_URL}>View student site</MenuLink>
      <MenuSeparator />
      <MenuLink href="/login" icon={<LogOut className="h-4 w-4" aria-hidden="true" />}>
        <span className="text-red-600">Logout</span>
      </MenuLink>
    </Dropdown>
  );
}

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const crumbs = breadcrumbsFor(pathname);
  const title = pageTitleFor(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <IconButton label="Open menu" onClick={onMenuClick} className="lg:hidden">
          <Menu className="h-5 w-5" />
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
          <NotificationMenu />
          <ProfileMenu />
        </div>
      </div>
      <div className="px-4 pb-3 sm:px-6 lg:hidden">
        <GlobalSearch />
      </div>
    </header>
  );
}
