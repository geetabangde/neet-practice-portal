// The starter content shared by the seed scripts and the SQL export.
import type { PlanInput } from "../services/plan.service";

export const STARTER_SUBJECTS: [name: string, icon: string, description: string][] = [
  ["Anatomy", "bone", "Gross anatomy, embryology, histology and neuroanatomy."],
  ["Physiology", "activity", "Body systems, nerve and muscle physiology and homeostasis."],
  ["Biochemistry", "flask", "Metabolism, enzymes, molecular biology and clinical biochemistry."],
  ["Pathology", "microscope", "General and systemic pathology with haematology."],
  ["Pharmacology", "pill", "General pharmacology, autonomic drugs and chemotherapy."],
  ["Microbiology", "dna", "Bacteriology, virology, immunology and general microbiology."],
  ["Community Medicine", "heart", "Epidemiology, biostatistics, preventive and social medicine."],
  ["Ophthalmology", "eye", "Eye anatomy, refractive errors and common eye diseases."],
  ["Anaesthesia", "syringe", "General and regional anaesthesia and perioperative care."],
  ["Psychiatry", "brain", "Mood and psychotic disorders and psychiatric management."],
];

export const STARTER_PLANS: PlanInput[] = [
  {
    name: "Free Trial",
    price: 0,
    durationMonths: 1,
    status: "active",
    features: ["Sample modules in every subject", "Answers with explanations", "Limited custom modules"],
  },
  {
    name: "Plan A",
    price: 9999,
    durationMonths: 9,
    status: "active",
    features: ["Full Test Series", "Grand Tests with rank", "Score and rank report", "Performance analytics"],
  },
  {
    name: "Plan B",
    price: 14999,
    durationMonths: 12,
    status: "active",
    features: ["QBank with 18,500+ MCQs", "Full Test Series", "Custom Module", "Bookmarks and Magic Module"],
  },
  {
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
    name: "Legacy Plan",
    price: 7999,
    durationMonths: 6,
    status: "inactive",
    features: ["QBank access", "Basic Test Series"],
  },
];

