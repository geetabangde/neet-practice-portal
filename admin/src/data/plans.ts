import type { Plan } from "@/types";

export const plansData: Plan[] = [
  {
    id: "p-001",
    name: "Free Trial",
    price: 0,
    durationMonths: 1,
    status: "active",
    features: ["Sample modules in every subject", "Answers with explanations", "Limited custom modules"],
  },
  {
    id: "p-002",
    name: "Plan A",
    price: 9999,
    durationMonths: 9,
    status: "active",
    features: ["Full Test Series", "Grand Tests with rank", "Score and rank report", "Performance analytics"],
  },
  {
    id: "p-003",
    name: "Plan B",
    price: 14999,
    durationMonths: 12,
    status: "active",
    features: ["QBank with 18,500+ MCQs", "Full Test Series", "Custom Module", "Bookmarks and Magic Module"],
  },
  {
    id: "p-004",
    name: "Plan C",
    price: 28999,
    durationMonths: 12,
    status: "active",
    features: [
      "810+ hours of video classes",
      "QBank with 18,500+ MCQs",
      "Test Series with 390+ tests",
      "Updated Schema",
      "Priority doubt support",
    ],
  },
  {
    id: "p-005",
    name: "Legacy Plan",
    price: 7999,
    durationMonths: 6,
    status: "inactive",
    features: ["QBank access", "Basic Test Series"],
  },
];
