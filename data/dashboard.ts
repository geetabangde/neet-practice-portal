import type {
  BookmarkItem,
  DashboardNavItem,
  DashboardPromo,
  DashboardSubject,
  DashboardUser,
  SubjectModule,
  SubjectQuestion,
  SubjectTopic,
} from "@/types/dashboard";

// Placeholder data copied from the Figma design. There is no backend yet, so
// nothing here belongs to a real user.
export const dashboardNav: DashboardNavItem[] = [
  { label: "QBank", href: "/dashboard", icon: "qbank" },
  { label: "Bookmarks", href: "/dashboard/bookmarks", icon: "bookmarks" },
  { label: "Test Series", href: "#", icon: "tests" },
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
  href: "#",
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
