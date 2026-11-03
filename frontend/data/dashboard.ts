import type {
  BookmarkItem,
  DashboardNavItem,
  DashboardPromo,
  DashboardSubject,
  DashboardUser,
  Plan,
  SubjectModule,
  SubjectQuestion,
  SubjectTopic,
  TestItem,
  TestKind,
  TestQuestionStatus,
} from "@/types/dashboard";

// Placeholder data copied from the Figma design. There is no backend yet, so
// nothing here belongs to a real user.
export const dashboardNav: DashboardNavItem[] = [
  { label: "QBank", href: "/dashboard", icon: "qbank" },
  { label: "Bookmarks", href: "/dashboard/bookmarks", icon: "bookmarks" },
  { label: "Test Series", href: "/dashboard/test-series", icon: "tests" },
];

export const dashboardUser: DashboardUser = {
  name: "Alex Williamson",
  course: "NEET PG",
  avatar: "/avatars/avatar-1.png",
};

export const modulesSummary = { completed: 829, total: 835 };

export const dashboardSubjects: DashboardSubject[] = [
  { name: "Anatomy", slug: "anatomy", icon: "anatomy", completed: 63, total: 63, percent: 100, toneClass: "bg-[#ffe6e6]" },
  { name: "Physiology", slug: "physiology", icon: "physiology", completed: 43, total: 43, percent: 68, toneClass: "bg-[#ece8ff]" },
  { name: "Microbiology", slug: "microbiology", icon: "microbiology", completed: 63, total: 63, percent: 50, toneClass: "bg-[#e6eeff]" },
  { name: "Community Medicine", slug: "community-medicine", icon: "community-medicine", completed: 64, total: 64, percent: 68, toneClass: "bg-[#dcfbea]" },
  { name: "Ophthalmology", slug: "ophthalmology", icon: "ophthalmology", completed: 35, total: 35, percent: 50, toneClass: "bg-[#fff3df]" },
  { name: "Anaesthesia", slug: "anaesthesia", icon: "anaesthesia", completed: 35, total: 35, percent: 100, toneClass: "bg-[#e3efff]" },
  { name: "Psychiatry", slug: "psychiatry", icon: "psychiatry", completed: 35, total: 35, percent: 0, toneClass: "bg-[#ffe6e6]" },
  { name: "Biochemistry", slug: "biochemistry", icon: "biochemistry", completed: 35, total: 35, percent: 30, toneClass: "bg-[#eaeaea]" },
  { name: "Pharmacology", slug: "pharmacology", icon: "pharmacology", completed: 35, total: 35, percent: 0, toneClass: "bg-[#fdeaff]" },
  { name: "Pathology", slug: "pathology", icon: "pathology", completed: 35, total: 35, percent: 30, toneClass: "bg-[#d9f8fc]" },
];

export const customModulePromo: DashboardPromo = {
  title: "Custom Module",
  description: "Create a custom MCQ module with the difficulty level, length & subjects of your choice.",
  cta: "Create and Solve",
  href: "/dashboard/custom-module",
};

export const revisionPromo: DashboardPromo = {
  title: "World of Revision",
  description: "Available to video plan users",
  cta: "Check it out",
  href: "#",
};

// Topics are only filled in for Biochemistry (the one screen in the design).
// Other subjects show an empty state until their topics are added here.
export const subjectTopics: Record<string, SubjectTopic[]> = {
  biochemistry: [
    { name: "Carbohydrates", mcqs: 120, image: "carbohydrates" },
    { name: "Amino Acids and Proteins", mcqs: 120, image: "amino-acids-and-proteins" },
    { name: "Lipids", mcqs: 120, image: "lipids" },
    { name: "Enzymes and Porphyrins", mcqs: 120, image: "enzymes-and-porphyrins" },
    { name: "Clinical Biochemistry & Nutrition", mcqs: 120, image: "clinical-biochemistry-and-nutrition" },
    { name: "Genetics", mcqs: 120, image: "genetics", fullBleed: true },
  ],
};

// Modules are only filled in for Biochemistry (the one screen in the design)
export const subjectModules: Record<string, SubjectModule[]> = {
  biochemistry: [
    { title: "Chemistry of Carbohydrates, Amino sugars and Mucopolysaccharides", slug: "chemistry-of-carbohydrates", mcqs: 22, rating: 4.5, image: "carbohydrate-chemistry", locked: true },
    { title: "Glycolysis and gluconeogenesis", slug: "glycolysis-and-gluconeogenesis", mcqs: 22, rating: 4.5, image: "glycolysis", locked: false },
    { title: "Glycogen metabolism and glycogen storage disorders", slug: "glycogen-metabolism", mcqs: 22, rating: 4.5, image: "glycogen-metabolism", locked: true },
    { title: "HMP shunt pathway, Fructose, Galactose metabolism", slug: "hmp-shunt-pathway", mcqs: 22, rating: 4.5, image: "hmp-shunt", locked: true },
    { title: "ETC and bioenergetics", slug: "etc-and-bioenergetics", mcqs: 22, rating: 4.5, image: "etc-bioenergetics", locked: false },
    { title: "Krebs Cycle", slug: "krebs-cycle", mcqs: 22, rating: 4.5, image: "krebs-cycle", locked: true },
  ],
};

// Questions, keyed by "<subject slug>/<module slug>". Only the one question
// from the design exists so far; the answer key is not part of the design yet.
export const moduleQuestions: Record<string, SubjectQuestion[]> = {
  "biochemistry/glycolysis-and-gluconeogenesis": [
    {
      text: "Which of the following is false about glycolysis?",
      image: "carbohydrate-chemistry",
      options: [
        { text: "Occurs in the cytoplasm", percent: 4.91 },
        { text: "Conversion of glucose to 3- carbon units", percent: 8.56 },
        { text: "Complete breakdown of glucose", percent: 18.12 },
        { text: "2 ATPs are utilized in the pathway", percent: 75.14 },
      ],
    },
  ],
};

// Newest first. Placeholder entries copied from the design.
export const bookmarks: BookmarkItem[] = [
  { title: "Chemistry of Carbohydrates, Amino sugars and Mucopolysaccharides", subjectSlug: "biochemistry", slug: "chemistry-of-carbohydrates", mcqs: 10, labelClass: "text-accent" },
  { title: "Homeostasis and cellular physiology", subjectSlug: "physiology", slug: "homeostasis-and-cellular-physiology", mcqs: 10, labelClass: "text-[#8b7cf6]" },
  { title: "ANS Introduction & Parasympathomimetics", subjectSlug: "pharmacology", slug: "ans-introduction", mcqs: 10, labelClass: "text-[#e879f9]" },
  { title: "History of Medicine", subjectSlug: "community-medicine", slug: "history-of-medicine", mcqs: 10, labelClass: "text-[#34d399]" },
  { title: "Embryonic Phase of Development", subjectSlug: "anatomy", slug: "embryonic-phase-of-development", mcqs: 10, labelClass: "text-[#f87171]" },
];

// Bookmarked questions, keyed by bookmark slug. Only the question from the design exists so far.
export const bookmarkQuestions: Record<string, SubjectQuestion[]> = {
  "chemistry-of-carbohydrates": [
    { ...moduleQuestions["biochemistry/glycolysis-and-gluconeogenesis"][0], image: undefined },
  ],
};

// Plans and prices for NEET PG & FMGE
export const plans: Plan[] = [
  {
    name: "Plan A",
    audience: "NEET PG / FMGE",
    includes: "Test Series",
    options: [
      { months: 9, price: 9999, originalPrice: 12999 },
      { months: 12, price: 11999, originalPrice: 15999, recommended: true },
    ],
    features: [
      "390+ total Tests (130+ Grand Tests)",
      "NEET PG, INI-CET & FMGE pattern mock tests",
      "Subject-wise tests & mini mock tests",
      "AI-based national ranking & percentile analysis",
      "Detailed question explanations & key clinical takeaways",
    ],
    defaultMonths: 9,
  },
  {
    name: "Plan C",
    audience: "NEET PG / FMGE",
    includes: "Videos + QBank + Test Series",
    options: [
      { months: 3, price: 16999, originalPrice: 25999 },
      { months: 9, price: 23999, originalPrice: 31999 },
      { months: 12, price: 28999, originalPrice: 37999, recommended: true },
      { months: 15, price: 33999, originalPrice: 42999 },
      { months: 24, price: 42999, originalPrice: 52999 },
      { months: 36, price: 49999, originalPrice: 61999 },
    ],
    features: [
      "810+ hours of Video classes",
      "Integrated conceptual content across all 19 subjects",
      "New interactive videos for MCQ Discussion",
      "World of Revision",
      "Animations & real clinical scenarios for better understanding",
      "QBank with 18,500+ MCQs",
      "Magic Module – curated list of MCQs that you got wrong",
      "Updated Schema – all important & repeatedly asked topics at a glance",
      "390+ total Tests (130+ Grand Tests)",
    ],
    defaultMonths: 3,
    popular: true,
  },
  {
    name: "Plan B",
    audience: "NEET PG / FMGE",
    includes: "QBank + Test Series",
    options: [
      { months: 3, price: 6999, originalPrice: 12999 },
      { months: 9, price: 11999, originalPrice: 18999 },
      { months: 12, price: 14999, originalPrice: 21999, recommended: true },
    ],
    features: [
      "QBank with 18,500+ MCQs",
      "Magic Module – curated list of MCQs that you got wrong",
      "Updated Schema – all important & repeatedly asked topics at a glance",
      "390+ total Tests (130+ Grand Tests)",
      "High-yield image-based and clinical questions",
      "Detailed explanations with key takeaways",
    ],
    defaultMonths: 3,
  },
];

// ---- Create a Custom Module (placeholder options copied from the design) ----

// The subject picker has two columns; these are the slugs in each, top to bottom
export const customModuleColumns: string[][] = [
  ["anatomy", "microbiology", "ophthalmology", "pharmacology", "pathology"],
  ["physiology", "community-medicine", "anaesthesia", "biochemistry", "psychiatry"],
];

// Modules you can pick inside a subject. Only two subjects have them in the design.
export const customSubjectModules: Record<string, { title: string; count: number }[]> = {
  anatomy: [
    { title: "History of Medicine", count: 1 },
    { title: "Concept of Health and Disease", count: 1 },
    { title: "Epidemiology", count: 1 },
  ],
  "community-medicine": [
    { title: "History of Medicine", count: 1 },
    { title: "Concept of Health and Disease", count: 1 },
    { title: "Epidemiology", count: 1 },
  ],
};

export const customModuleTags = [
  "#AIIMS", "#Numbers", "#TheCommons", "#Problems", "#ImageBased", "#RecentUpdates",
  "#Controversial", "#recentNEET", "#Investigation_of_Choice", "#Eponyms", "#Drug Of Choice",
  "#Criteria", "#Instruments", "#Slides", "#Clinical", "#GIFBased",
];

// Questions for a custom module. Only the question from the design exists so far.
export const customModuleQuestions: SubjectQuestion[] = [
  moduleQuestions["biochemistry/glycolysis-and-gluconeogenesis"][0],
];

// Placeholder tests copied from the design. Only the Grand Tests that are fully visible there are listed.
export const testSeriesYear = "2025 - 26";

export const testSeries: Record<TestKind, TestItem[]> = {
  grand: [
    { title: "Grand Test 1 - INICET Pattern", date: "2025-09-08", mcqs: 200, minutes: 180, pattern: "INICET", locked: true },
    { title: "Grand Test 2 - NEET Pattern", date: "2025-09-22", mcqs: 200, minutes: 180, pattern: "NEET", mock: true },
    { title: "Grand Test 3 - INICET Pattern", date: "2025-10-06", mcqs: 200, minutes: 180, pattern: "INICET", locked: true },
    { title: "National INI-CET Mock 2025 Nov Session", date: "2025-10-22", mcqs: 200, minutes: 180, pattern: "INICET", locked: true },
    { title: "Grand Test 4 - NEET Pattern", date: "2025-10-27", mcqs: 200, minutes: 180, pattern: "NEET", mock: true },
  ],
  mini: [],
  subject: [],
};

// The test attempt screen. Only the question from the design exists so far.
export const testAttemptTotal = 25;
export const testAttemptQuestions: SubjectQuestion[] = customModuleQuestions;

// Sample progress shown when the test screen opens, copied from the design
// (question 1 answered, 2 marked, 3-5 not answered, and so on). Retake clears it.
export const testAttemptSampleStatuses: TestQuestionStatus[] = ["answered","marked","notAnswered","notAnswered","notAnswered","notVisited","notVisited","notVisited","answered","answered","answered","marked","notVisited","notVisited","answered","answered","answered","answeredMarked","answeredMarked","answered","marked","notAnswered","notAnswered","notAnswered","notAnswered"];
