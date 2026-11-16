// Creates the "subjects" table and adds the ten starter subjects. Run with: npm run seed:subjects
// Safe to run again: a subject whose name already exists is skipped.
import "dotenv/config";
import { pool } from "../config/db";
import { CREATE_SUBJECTS_TABLE } from "../services/subject.service";
import { STARTER_SUBJECTS } from "./starter-data";

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
