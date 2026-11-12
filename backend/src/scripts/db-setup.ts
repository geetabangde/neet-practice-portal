// Creates the content tables (subjects, topics, questions, tests, then plans) if they do not exist yet. Run with: npm run db:setup
// Order matters: topics points to subjects, questions point to both, and tests point to all three. Existing data is never touched.
import "dotenv/config";
import { pool } from "../config/db";
import { CREATE_SUBJECTS_TABLE } from "../services/subject.service";
import { CREATE_PLAN_TABLES } from "../services/plan.service";
import { CREATE_QUESTIONS_TABLE } from "../services/question.service";
import { CREATE_TEST_TABLES } from "../services/test.service";
import { CREATE_TOPICS_TABLE } from "../services/topic.service";

async function main(): Promise<void> {
  await pool.query(CREATE_SUBJECTS_TABLE);
  await pool.query(CREATE_TOPICS_TABLE);
  await pool.query(CREATE_QUESTIONS_TABLE);
  for (const statement of CREATE_TEST_TABLES) await pool.query(statement);
  for (const statement of CREATE_PLAN_TABLES) await pool.query(statement);
  console.log("Tables ready: subjects, topics, questions, tests, plans");
}

main()
  .catch((error: unknown) => {
    console.error("Setup failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
