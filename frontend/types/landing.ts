export type NavLink = {
  label: string;
  href: string;
};

export type Feature = {
  tag: string;
  title: string;
  description: string;
  // Preview image exported from the design, shown at the top of the card
  image: string;
  imageAlt: string;
  // Path of the small icon shown inside the tag pill
  icon: string;
  // Tailwind classes for the tag pill colours
  tagClass: string;
};

export type Subject = {
  name: string;
  // File name (without extension) in public/subjects
  icon: string;
  // Shown as-is, e.g. "63/63"
  modules: string;
  percent: number;
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
