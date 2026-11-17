import type { Metadata } from "next";
import { Suspense } from "react";
import BookmarkedPractice from "@/components/dashboard/BookmarkedPractice";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: "Bookmarks | HN QBank",
  robots: { index: false },
};

type BookmarkPageProps = {
  // The id of the module whose bookmarks are shown
  params: Promise<{ bookmark: string }>;
};

// Reads the address of the page, so it sits inside Suspense. The modules are not known ahead of time.
async function Bookmarked({ params }: BookmarkPageProps) {
  const { bookmark } = await params;
  return <BookmarkedPractice moduleId={bookmark} />;
}

export default function BookmarkPage({ params }: BookmarkPageProps) {
  return (
    <DashboardShell title="QBank Edition 8">
      <Suspense fallback={<p className="mt-5 rounded-xl bg-white p-6 text-sm text-slate-600">Loading...</p>}>
        <Bookmarked params={params} />
      </Suspense>
    </DashboardShell>
  );
}
