import type {
  FaqItem,
  Feature,
  FooterColumn,
  NavLink,
  Stat,
  Subject,
} from "@/types/landing";

export const navLinks: NavLink[] = [
  { label: "Practice", href: "#practice" },
  { label: "Courses", href: "#courses" },
  { label: "Features", href: "#features" },
  { label: "Subjects", href: "#subjects" },
  { label: "FAQ", href: "#faq" },
];

export const tickerItems: string[] = [
  "390+ tests",
  "810+ hours of video",
  "19 subjects",
  "Magic Module",
  "Works on web and mobile",
  "Updated Schema",
  "18,500+ MCQs",
];

export const practiceChecklist: string[] = [
  "Full access to selected module",
  "See what percentage of students chose each option",
  "Question Navigator: correct, incorrect, unattempted, bookmarked",
  "Instant scorecard with your position after every test",
];

export const sampleOptions: { text: string; percent: number }[] = [
  { text: "Occurs in the cytoplasm", percent: 4 },
  { text: "Conversion of glucose to 8-carbon units", percent: 8 },
  { text: "Complete breakdown of glucose", percent: 12 },
  { text: "2 ATPs are utilised in the pathway", percent: 76 },
];

export const features: Feature[] = [
  {
    tag: "Learn",
    title: "Video Classes",
    description:
      "810+ hours of integrated concept videos across 19 subjects, with interactive MCQ discussions.",
    preview: "video",
    panelClass: "bg-rose-50",
  },
  {
    tag: "Practice",
    title: "Custom Module",
    description:
      "Build a set by difficulty, length and subjects, then solve it on the same exam interface.",
    preview: "custom",
    panelClass: "bg-violet-50",
  },
  {
    tag: "Navigate",
    title: "Question Navigator",
    description:
      "Jump to any question and see your status across the whole module at a glance.",
    preview: "navigator",
    panelClass: "bg-rose-50",
  },
  {
    tag: "Revise",
    title: "Magic Module",
    description:
      "An automatic set of the MCQs you got wrong, so revision targets your weak spots.",
    preview: "magic",
    panelClass: "bg-sky-50",
  },
  {
    tag: "Save",
    title: "Bookmarks",
    description:
      "Save modules and questions, filter by subject and sort by newest first.",
    preview: "bookmarks",
    panelClass: "bg-emerald-50",
  },
  {
    tag: "Improve",
    title: "Score and Rank Report",
    description:
      "See your score, correct vs incorrect and your position, then review answers or retake.",
    preview: "score",
    panelClass: "bg-indigo-50",
  },
];

export const subjects: Subject[] = [
  { name: "Anatomy", modulesDone: 63, modulesTotal: 63 },
  { name: "Microbiology", modulesDone: 32, modulesTotal: 63 },
  { name: "Ophthalmology", modulesDone: 18, modulesTotal: 35 },
  { name: "Psychiatry", modulesDone: 0, modulesTotal: 35 },
  { name: "Pharmacology", modulesDone: 0, modulesTotal: 28 },
  { name: "Community Medicine", modulesDone: 43, modulesTotal: 64 },
  { name: "Physiology", modulesDone: 29, modulesTotal: 43 },
  { name: "Forensic Medicine", modulesDone: 20, modulesTotal: 40 },
  { name: "Pediatrics", modulesDone: 44, modulesTotal: 64 },
  { name: "Anaesthesia", modulesDone: 35, modulesTotal: 35 },
  { name: "Biochemistry", modulesDone: 11, modulesTotal: 35 },
  { name: "Pathology", modulesDone: 11, modulesTotal: 35 },
];

export const stats: Stat[] = [
  { value: "18,500+", label: "MCQs in the question bank" },
  { value: "390+", label: "tests including 130+ Grand Tests" },
  { value: "810+", label: "hours of video classes" },
  { value: "19", label: "subjects fully covered" },
];

export const trialPerks: string[] = [
  "Sample modules in every subject",
  "Answers with explanations",
  "Custom modules and score reports",
];

export const examOptions = ["NEET PG", "FMGE"] as const;

export const faqs: FaqItem[] = [
  {
    question: "Which exams is this for?",
    answer:
      "NEET PG (NExT) and FMGE, with content across all 19 subjects.",
  },
  {
    question: "What does the free trial include?",
    answer:
      "Sample modules in every subject, answers with explanations, and access to custom modules and score reports. No payment is required.",
  },
  {
    question: "What is Magic Module?",
    answer:
      "An automatic set built from the MCQs you answered wrongly, so your revision targets your weak spots.",
  },
  {
    question: "Can I make my own practice sets?",
    answer:
      "Yes. Custom Module lets you pick subjects, difficulty and length, then solve the set on the same exam interface.",
  },
  {
    question: "Which devices can I use?",
    answer: "The platform works on the web and on mobile browsers.",
  },
  {
    question: "What is the refund policy?",
    answer:
      "Refund terms are listed on the Terms of Use page. Talk to our team if you have questions before enrolling.",
  },
];

export const footerColumns: FooterColumn[] = [
  {
    title: "Courses",
    links: [
      { label: "Plan A", href: "#courses" },
      { label: "Plan B", href: "#courses" },
      { label: "Plan C", href: "#courses" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Practice", href: "#practice" },
      { label: "Features", href: "#features" },
      { label: "Subjects", href: "#subjects" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#top" },
      { label: "Terms of Use", href: "#top" },
      { label: "Privacy Policy", href: "#top" },
    ],
  },
];
