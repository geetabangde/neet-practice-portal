// Creates the content tables (subjects, modules, topics, questions, tests, plans, students) if they do not exist yet. Run with: npm run db:setup
// Order matters: topics points to subjects, questions point to both, and tests point to all three. Existing data is never touched.
import "dotenv/config";
import { pool } from "../config/db";
import { CREATE_SUBJECTS_TABLE } from "../services/subject.service";
import { CREATE_BOOKMARKS_TABLE } from "../services/bookmark.service";
import { CREATE_CUSTOM_MODULE_TABLES } from "../services/custom-module.service";
import { CREATE_MODULES_TABLE, migrateTopicsToModules } from "../services/module.service";
import { CREATE_PLAN_TABLES } from "../services/plan.service";
import { CREATE_QUESTIONS_TABLE } from "../services/question.service";
import { CREATE_ATTEMPT_TABLES } from "../services/test-attempt.service";
import { CREATE_IMAGE_TABLES, migrateImageChunks, migrateImageToken } from "../services/image.service";
import { migrateOptionColumns } from "../services/rich-text.service";
import { migrateTestQuestionImage, migrateTestQuestions } from "../services/test-paper.service";
import { migrateTestSections } from "../services/test-section.service";
import { CREATE_TEST_TABLES, migrateNegativeRatio, migrateTestKind } from "../services/test.service";
import { CREATE_ANSWERS_TABLE } from "../services/student-practice.service";
import { CREATE_PURCHASE_TABLES } from "../services/student-plan.service";
import { CREATE_STUDENT_TABLES } from "../services/student.service";
import { CREATE_TOPICS_TABLE, migrateTopicDuration } from "../services/topic.service";

async function main(): Promise<void> {
  await pool.query(CREATE_SUBJECTS_TABLE);
  await pool.query(CREATE_MODULES_TABLE);
  await pool.query(CREATE_TOPICS_TABLE);
  await pool.query(CREATE_QUESTIONS_TABLE);
  // The first version of the image table kept the picture in one column: move it into pieces before the new table is used
  for (const statement of CREATE_IMAGE_TABLES) await pool.query(statement);
  for (const statement of CREATE_TEST_TABLES) await pool.query(statement);
  for (const statement of CREATE_PLAN_TABLES) await pool.query(statement);
  for (const statement of CREATE_STUDENT_TABLES) await pool.query(statement);
  await pool.query(CREATE_ANSWERS_TABLE);
  await pool.query(CREATE_BOOKMARKS_TABLE);
  for (const statement of CREATE_CUSTOM_MODULE_TABLES) await pool.query(statement);
  for (const statement of CREATE_ATTEMPT_TABLES) await pool.query(statement);
  for (const statement of CREATE_PURCHASE_TABLES) await pool.query(statement);
  // An older database has topics without modules: this moves them into a module called "General"
  const moved = await migrateTopicsToModules();
  await migrateTestKind();
  // An older database typed the negative marks as a number: it becomes 1/3 or 1/4 of the marks
  await migrateNegativeRatio();
  await migrateTopicDuration();
  // An older database made tests out of QBank questions: every test gets its own copy of its questions (after the attempt tables exist)
  const copied = await migrateTestQuestions();
  if (copied) console.log(`Test questions: ${copied.copied} QBank questions were copied into the tests they were used in.`);
  // The option columns become TEXT, so an option written in the editor (HTML) fits
  await migrateOptionColumns();
  // Questions get an image_token column (an older database does not have it)
  await migrateImageToken();
  await migrateImageChunks();
  // Test questions get image columns too
  await migrateTestQuestionImage();
  // Test questions can be in a part (Part A, Part B ...)
  await migrateTestSections();
  console.log(`Tables ready: subjects, modules, topics, questions, tests, plans, students (topics to modules: ${moved})`);
}

main()
  .catch((error: unknown) => {
    console.error("Setup failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
