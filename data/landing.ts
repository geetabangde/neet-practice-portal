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

export const features: Feature[] = [
  {
    tag: "Learn",
    title: "Video Classes",
    description:
      "810+ hours of integrated concept videos across 19 subjects, with interactive MCQ discussions.",
    image: "/features/video.png",
    imageAlt: "Video player showing the lesson Glycolysis, full solution",
    icon: "/icons/feature-learn.png",
    tagClass: "bg-orange-100 text-orange-500",
  },
  {
    tag: "Practice",
    title: "Custom Module",
    description:
      "Build a set by difficulty, length and subjects, then solve it on the same exam interface.",
    image: "/features/custom.png",
    imageAlt: "Create a Custom Module screen with number of questions, difficulty level and question source options",
    icon: "/icons/feature-practice.png",
    tagClass: "bg-indigo-100 text-indigo-600",
  },
  {
    tag: "Navigate",
    title: "Question Navigator",
    description:
      "Jump to any question and see your status across the whole module at a glance.",
    image: "/features/navigator.png",
    imageAlt: "Question Navigator grid showing correct, incorrect, unattempted and bookmarked questions",
    icon: "/icons/feature-navigate.png",
    tagClass: "bg-rose-100 text-rose-500",
  },
  {
    tag: "Revise",
    title: "Magic Module",
    description:
      "An automatic set of the MCQs you got wrong, so revision targets your weak spots.",
    image: "/features/magic.png",
    imageAlt: "Magic Module question with the answer options and the percentage of students who chose each",
    icon: "/icons/feature-revise.png",
    tagClass: "bg-sky-100 text-sky-600",
  },
  {
    tag: "Save",
    title: "Bookmarks",
    description:
      "Save modules and questions, filter by subject and sort by newest first.",
    image: "/features/bookmarks.png",
    imageAlt: "List of bookmarked modules across subjects",
    icon: "/icons/feature-save.png",
    tagClass: "bg-green-100 text-green-700",
  },
  {
    tag: "Improve",
    title: "Score And Rank Report",
    description:
      "See your score, correct vs incorrect and your position, then review answers or retake.",
    image: "/features/score.png",
    imageAlt: "Test Completed screen showing score, position, correct and incorrect counts",
    icon: "/icons/feature-improve.png",
    tagClass: "bg-violet-100 text-violet-500",
  },
];

// Placeholder figures copied from the Figma design (it repeats some subjects)
export const subjects: Subject[] = [
  { name: "Anatomy", icon: "anatomy", modules: "63/63", percent: 100 },
  { name: "Microbiology", icon: "microbiology", modules: "63/63", percent: 50 },
  { name: "Ophthalmology", icon: "ophthalmology", modules: "35/35", percent: 50 },
  { name: "Psychiatry", icon: "psychiatry", modules: "35/35", percent: 0 },
  { name: "Pharmacology", icon: "pharmacology", modules: "35/35", percent: 0 },
  { name: "Community Medicine", icon: "community-medicine", modules: "64/64", percent: 68 },
  { name: "Microbiology", icon: "microbiology-2", modules: "63/63", percent: 50 },
  { name: "Physiology", icon: "physiology", modules: "43/43", percent: 68 },
  { name: "Community Medicine", icon: "community-medicine-2", modules: "64/64", percent: 68 },
  { name: "Anaesthesia", icon: "anaesthesia", modules: "35/35", percent: 100 },
  { name: "Biochemistry", icon: "biochemistry", modules: "35/35", percent: 30 },
  { name: "Pathology", icon: "pathology", modules: "35/35", percent: 30 },
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
