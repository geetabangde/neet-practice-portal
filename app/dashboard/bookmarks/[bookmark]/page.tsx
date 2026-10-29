import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BookmarkedQuestions from "@/components/dashboard/BookmarkedQuestions";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { bookmarkQuestions, bookmarks, dashboardSubjects } from "@/data/dashboard";

type BookmarkPageProps = {
  params: Promise<{ bookmark: string }>;
};

function findBookmark(slug: string) {
  const bookmark = bookmarks.find((b) => b.slug === slug);
  const subject = bookmark && dashboardSubjects.find((s) => s.slug === bookmark.subjectSlug);
  return bookmark && subject ? { bookmark, subject } : null;
}

export function generateStaticParams() {
  return bookmarks.map((b) => ({ bookmark: b.slug }));
}

export async function generateMetadata({ params }: BookmarkPageProps): Promise<Metadata> {
  const { bookmark: slug } = await params;
  const found = findBookmark(slug);
  return {
    title: found ? `${found.bookmark.title} | Bookmarks | HN QBank` : "Bookmarks | HN QBank",
    robots: { index: false },
  };
}

export default async function BookmarkPage({ params }: BookmarkPageProps) {
  const { bookmark: slug } = await params;
  const found = findBookmark(slug);
  if (!found) notFound();

  const { bookmark, subject } = found;
  const questions = bookmarkQuestions[slug] ?? [];

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

      {questions.length > 0 ? (
        <BookmarkedQuestions subjectName={subject.name} total={bookmark.mcqs} questions={questions} />
      ) : (
        <>
          <h1 className="mt-4 text-2xl font-bold">{subject.name}</h1>
          <p className="mt-1 text-xs font-semibold uppercase">Total : {bookmark.mcqs}</p>
          <p className="mt-5 rounded-xl bg-white p-6 text-sm text-slate-600">
            The bookmarked questions for &ldquo;{bookmark.title}&rdquo; will be added soon.
          </p>
        </>
      )}
    </DashboardShell>
  );
}
