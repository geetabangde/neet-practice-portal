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

export type PlanOption = {
  months: number;
  price: number;
  // Price before the discount, shown struck through
  originalPrice: number;
  recommended?: boolean;
};

export type Plan = {
  name: string;
  audience: string;
  includes: string;
  // Shown in the "Learn More" pop-up. Missing until the details are provided.
  features?: string[];
  options: PlanOption[];
  // Duration (in months) that starts out selected
  defaultMonths?: number;
  popular?: boolean;
};

export type TestKind = "grand" | "mini" | "subject";

export type TestItem = {
  title: string;
  // Exam day as YYYY-MM-DD
  date: string;
  mcqs: number;
  minutes: number;
  pattern: "INICET" | "NEET";
  // Locked tests show the "GET" badge
  locked?: boolean;
  // Free practice tests show the "Mock Test" tag
  mock?: boolean;
};

// Text with some words in bold, e.g. [{ text: "Note: ", bold: true }, { text: "..." }]
export type RichText = string | { text: string; bold?: boolean }[];

export type InstructionItem = {
  text: RichText;
  // Whole item is bold
  bold?: boolean;
  bullets?: RichText[];
  // Shows the question palette colour legend under this item
  palette?: boolean;
};

export type InstructionGroup = {
  heading: string;
  // Number of the first item. The numbering carries on across groups.
  start: number;
  items: InstructionItem[];
};

// How a question shows up in the test's question palette
export type TestQuestionStatus = "notVisited" | "notAnswered" | "answered" | "marked" | "answeredMarked";
