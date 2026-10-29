export type DashboardNavItem = {
  label: string;
  href: string;
  icon: "qbank" | "bookmarks" | "tests";
};

export type DashboardSubject = {
  name: string;
  // Used in the URL: /dashboard/<slug>
  slug: string;
  // File name (without extension) in public/subjects
  icon: string;
  completed: number;
  total: number;
  percent: number;
  // Full Tailwind background class, written out so Tailwind can find it
  toneClass: string;
};

export type DashboardUser = {
  name: string;
  course: string;
  avatar: string;
};

export type DashboardPromo = {
  title: string;
  description: string;
  cta: string;
  href: string;
};

export type SubjectTopic = {
  name: string;
  mcqs: number;
  // File name (without extension) in public/topics
  image: string;
  // True when the picture already has its own tile background and fills the box
  fullBleed?: boolean;
};

export type SubjectModule = {
  title: string;
  // Used in the URL: /dashboard/<subject>/modules/<slug>
  slug: string;
  mcqs: number;
  rating: number;
  // File name (without extension) in public/modules
  image: string;
  // Locked modules show the "GET" badge
  locked: boolean;
};

export type QuestionOption = {
  text: string;
  // Share of students who picked this option, shown after answering
  percent: number;
};

export type SubjectQuestion = {
  text: string;
  // File name (without extension) in public/modules
  image?: string;
  options: QuestionOption[];
  // Index of the right option. Without it, answers cannot be marked correct or incorrect.
  correctIndex?: number;
};

export type BookmarkItem = {
  title: string;
  // Matches a DashboardSubject slug; the subject name and icon come from there
  subjectSlug: string;
  // Used in the URL: /dashboard/bookmarks/<slug>
  slug: string;
  mcqs: number;
  // Tailwind text colour for the small subject label
  labelClass: string;
};
