// Creates the content tables (subjects, modules, topics, questions, tests, plans, students) if they do not exist yet. Run with: npm run db:setup
// Order matters: topics points to subjects, questions point to both, and tests point to all three. Existing data is never touched.
import "dotenv/config";
import { pool } from "../config/db";
import { CREATE_SUBJECTS_TABLE } from "../services/subject.service";
import { CREATE_MODULES_TABLE, migrateTopicsToModules } from "../services/module.service";
import { CREATE_PLAN_TABLES } from "../services/plan.service";
import { CREATE_QUESTIONS_TABLE } from "../services/question.service";
import { CREATE_TEST_TABLES } from "../services/test.service";
import { CREATE_ANSWERS_TABLE } from "../services/student-practice.service";
import { CREATE_STUDENT_TABLES } from "../services/student.service";
import { CREATE_TOPICS_TABLE } from "../services/topic.service";

async function main(): Promise<void> {
  await pool.query(CREATE_SUBJECTS_TABLE);
  await pool.query(CREATE_MODULES_TABLE);
  await pool.query(CREATE_TOPICS_TABLE);
  await pool.query(CREATE_QUESTIONS_TABLE);
  for (const statement of CREATE_TEST_TABLES) await pool.query(statement);
  for (const statement of CREATE_PLAN_TABLES) await pool.query(statement);
  for (const statement of CREATE_STUDENT_TABLES) await pool.query(statement);
  await pool.query(CREATE_ANSWERS_TABLE);
  // An older database has topics without modules: this moves them into a module called "General"
  const moved = await migrateTopicsToModules();
  console.log(`Tables ready: subjects, modules, topics, questions, tests, plans, students (topics to modules: ${moved})`);
}

main()
  .catch((error: unknown) => {
    console.error("Setup failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
