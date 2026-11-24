export type DashboardNavItem = {
  label: string;
  href: string;
  icon: "qbank" | "custom" | "bookmarks" | "tests";
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
  durationMinutes?: number;
  // File name (without extension) in public/topics. Missing = a letter badge is shown instead.
  image?: string;
  // How many of the MCQs this student has answered. Missing = nothing is shown.
  done?: number;
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
