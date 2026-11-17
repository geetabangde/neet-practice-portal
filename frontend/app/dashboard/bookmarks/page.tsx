import type { Metadata } from "next";
import Link from "next/link";
import BookmarksView from "@/components/dashboard/BookmarksView";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: "Bookmarks | HN QBank",
  robots: { index: false },
};

export default function BookmarksPage() {
  return (
    <DashboardShell title="QBank Edition 8">
      <nav aria-label="Breadcrumb" className="text-xs">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/dashboard" className="text-accent-dark hover:underline">
              QBank
            </Link>
          </li>
          <li aria-hidden="true">&gt;</li>
          <li aria-current="page">Bookmarks</li>
        </ol>
      </nav>

      <BookmarksView />
    </DashboardShell>
  );
}
