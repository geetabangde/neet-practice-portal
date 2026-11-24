import { pool } from "../config/db";
import { CREATE_SUBJECTS_TABLE } from "./subject.service";
import { CREATE_BOOKMARKS_TABLE } from "./bookmark.service";
import { CREATE_CUSTOM_MODULE_TABLES } from "./custom-module.service";
import { CREATE_MODULES_TABLE, migrateTopicsToModules } from "./module.service";
import { CREATE_PLAN_TABLES } from "./plan.service";
import { CREATE_QUESTIONS_TABLE } from "./question.service";
import { CREATE_ATTEMPT_TABLES } from "./test-attempt.service";
import { migrateTestQuestions } from "./test-paper.service";
import { CREATE_TEST_TABLES, migrateNegativeRatio, migrateTestKind } from "./test.service";
import { CREATE_ANSWERS_TABLE } from "./student-practice.service";
import { CREATE_PURCHASE_TABLES } from "./student-plan.service";
import { CREATE_STUDENT_TABLES } from "./student.service";
import { CREATE_TOPICS_TABLE, migrateTopicDuration } from "./topic.service";

export async function ensureDbReady(): Promise<void> {
  // 1. Core tables
  await pool.query(CREATE_SUBJECTS_TABLE);
  await pool.query(CREATE_MODULES_TABLE);
  await pool.query(CREATE_TOPICS_TABLE);
  await pool.query(CREATE_QUESTIONS_TABLE);
  for (const statement of CREATE_TEST_TABLES) await pool.query(statement);
  for (const statement of CREATE_PLAN_TABLES) await pool.query(statement);
  for (const statement of CREATE_STUDENT_TABLES) await pool.query(statement);
  await pool.query(CREATE_ANSWERS_TABLE);
  await pool.query(CREATE_BOOKMARKS_TABLE);
  for (const statement of CREATE_CUSTOM_MODULE_TABLES) await pool.query(statement);
  for (const statement of CREATE_ATTEMPT_TABLES) await pool.query(statement);
  for (const statement of CREATE_PURCHASE_TABLES) await pool.query(statement);

  // 2. Incremental column and data migrations
  await migrateTopicsToModules();
  await migrateTestKind();
  await migrateNegativeRatio();
  await migrateTopicDuration();
  await migrateTestQuestions();
}
