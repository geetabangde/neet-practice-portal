// Creates the "subjects" table and adds the ten starter subjects. Run with: npm run seed:subjects
// Safe to run again: a subject whose name already exists is skipped.
import "dotenv/config";
import { pool } from "../config/db";
import { CREATE_SUBJECTS_TABLE } from "../services/subject.service";

const STARTER_SUBJECTS: [name: string, icon: string, description: string][] = [
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

async function main(): Promise<void> {
  await pool.query(CREATE_SUBJECTS_TABLE);
  let added = 0;
  for (const [name, icon, description] of STARTER_SUBJECTS) {
    const [result] = await pool.query("INSERT IGNORE INTO subjects (name, description, icon, status) VALUES (?, ?, ?, 'active')", [
      name,
      description,
      icon,
    ]);
    if ("affectedRows" in result) added += result.affectedRows;
  }
  console.log(`subjects table ready. ${added} starter subject(s) added.`);
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
