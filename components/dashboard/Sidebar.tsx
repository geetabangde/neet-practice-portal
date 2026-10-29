"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/ui/Logo";
import { dashboardNav, dashboardUser } from "@/data/dashboard";
import { BookmarkIcon, CloseIcon, LogoutIcon, QBankIcon, TestSeriesIcon } from "./icons";

const navIcons = {
  qbank: QBankIcon,
  bookmarks: BookmarkIcon,
  tests: TestSeriesIcon,
};

type SidebarProps = {
  // Only used on small screens, where the sidebar slides over the page
  onClose: () => void;
};

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  // The nav item with the longest matching href is the active one, so
  // /dashboard/bookmarks lights up Bookmarks and not QBank
  const activeHref = dashboardNav
    .filter((item) => item.href !== "#" && (pathname === item.href || pathname.startsWith(`${item.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <div className="flex h-full flex-col px-4 pb-6 pt-5">
      <div className="flex items-center justify-between">
        <Logo href="/" heightClass="h-14" />
        <button
          suppressHydrationWarning
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="rounded-lg p-2 text-white hover:bg-white/10 lg:hidden"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <nav aria-label="Dashboard" className="mt-8">
        <p className="text-xs font-medium uppercase tracking-wide text-white">Navigation</p>
        <ul className="mt-4 space-y-2">
          {dashboardNav.map((item) => {
            const Icon = navIcons[item.icon];
            const active = item.href === activeHref;
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-full px-2 py-2 text-sm font-semibold text-white ${
                    active
                      ? "border border-accent/40 bg-accent/20"
                      : "border border-transparent hover:bg-white/5"
                  }`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                    <Icon className="h-5 w-5" />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto pt-8">
        <p className="text-xs font-medium uppercase tracking-wide text-white">User account</p>
        <div className="mt-3 flex items-center gap-3">
          <Image
            src={dashboardUser.avatar}
            alt=""
            width={80}
            height={80}
            className="h-10 w-10 rounded-full border border-accent object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{dashboardUser.name}</p>
            <p className="text-[10px] text-white/80">Course : {dashboardUser.course}</p>
          </div>
        </div>
        {/* No session exists yet, so for now logging out just goes back to /login */}
        <Link
          href="/login"
          className="mt-4 flex items-center gap-3 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          <LogoutIcon className="h-5 w-5" />
          Log out
        </Link>
      </div>
    </div>
  );
}
