import type { Topic } from "@/types";
import { pad } from "./helpers";

// [subject id, topic names]. Biochemistry and Community Medicine reuse the topic names that
// already exist on the student site.
const topicSeeds: [string, string[]][] = [
  ["s-001", ["Upper Limb", "Lower Limb", "Thorax", "Head and Neck", "Neuroanatomy"]],
  ["s-002", ["General Physiology", "Nerve and Muscle", "Cardiovascular System", "Respiratory System"]],
  ["s-003", ["Carbohydrates", "Amino Acids and Proteins", "Lipids", "Enzymes and Porphyrins", "Clinical Biochemistry & Nutrition", "Genetics"]],
  ["s-004", ["General Pathology", "Hematology", "Systemic Pathology"]],
  ["s-005", ["General Pharmacology", "Autonomic Nervous System", "Chemotherapy"]],
  ["s-006", ["General Microbiology", "Immunology", "Bacteriology", "Virology"]],
  ["s-007", ["History of Medicine", "Concept of Health and Disease", "Epidemiology", "Biostatistics"]],
  ["s-008", ["Anatomy of the Eye", "Refractive Errors", "Glaucoma"]],
  ["s-009", ["General Anaesthesia", "Regional Anaesthesia"]],
  ["s-010", ["Mood Disorders", "Psychotic Disorders"]],
];

export const topicsData: Topic[] = topicSeeds
  .flatMap(([subjectId, names]) => names.map((name) => ({ subjectId, name })))
  .map((seed, i) => ({
    id: `t-${pad(i + 1)}`,
    subjectId: seed.subjectId,
    name: seed.name,
    // A few topics are switched off, to show both states
    status: i % 11 === 6 ? "inactive" : "active",
  }));
