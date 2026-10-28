export type NavLink = {
  label: string;
  href: string;
};

export type FeaturePreviewKind =
  | "video"
  | "custom"
  | "navigator"
  | "magic"
  | "bookmarks"
  | "score";

export type Feature = {
  tag: string;
  title: string;
  description: string;
  preview: FeaturePreviewKind;
  // Tailwind classes for the tinted preview panel
  panelClass: string;
};

export type Subject = {
  name: string;
  modulesDone: number;
  modulesTotal: number;
};

export type Stat = {
  value: string;
  label: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type FooterColumn = {
  title: string;
  links: NavLink[];
};
