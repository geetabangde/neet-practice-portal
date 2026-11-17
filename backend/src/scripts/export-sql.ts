// Writes backend/sql/setup.sql: every table plus the starter subjects and plans, as plain SQL
// for phpMyAdmin (Import tab) when the live server has no terminal. Run with: npm run db:export-sql
// It needs no database connection and contains no secrets. The admin account is made separately
// (npm run admin:sql), because it needs a password hash.
import { mkdirSync, writeFileSync } from "node:fs";
import { CREATE_ADMINS_TABLE } from "../services/auth.service";
import { CREATE_BOOKMARKS_TABLE } from "../services/bookmark.service";
import { CREATE_CUSTOM_MODULE_TABLES } from "../services/custom-module.service";
import { CREATE_MODULES_TABLE } from "../services/module.service";
import { CREATE_PLAN_TABLES } from "../services/plan.service";
import { CREATE_QUESTIONS_TABLE } from "../services/question.service";
import { CREATE_ANSWERS_TABLE } from "../services/student-practice.service";
import { CREATE_STUDENT_TABLES } from "../services/student.service";
import { CREATE_SUBJECTS_TABLE } from "../services/subject.service";
import { CREATE_ATTEMPT_TABLES } from "../services/test-attempt.service";
import { CREATE_TEST_TABLES } from "../services/test.service";
import { CREATE_TOPICS_TABLE } from "../services/topic.service";
import { STARTER_PLANS, STARTER_SUBJECTS } from "./starter-data";

// A text value as a SQL string: wrapped in quotes, with backslashes and quotes escaped
const text = (value: string) => `'${value.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;

// Same order as db-setup.ts: a table must exist before another one points to it
const tables = [
  CREATE_ADMINS_TABLE,
  CREATE_SUBJECTS_TABLE,
  CREATE_MODULES_TABLE,
  CREATE_TOPICS_TABLE,
  CREATE_QUESTIONS_TABLE,
  ...CREATE_TEST_TABLES,
  ...CREATE_PLAN_TABLES,
  ...CREATE_STUDENT_TABLES,
  CREATE_ANSWERS_TABLE,
  CREATE_BOOKMARKS_TABLE,
  ...CREATE_CUSTOM_MODULE_TABLES,
  ...CREATE_ATTEMPT_TABLES,
];

const lines: string[] = [
  "-- NEET PG practice portal: database setup for phpMyAdmin.",
  "-- Open phpMyAdmin, pick your database on the left, then Import and choose this file.",
  "-- Safe to import again: tables are only created if missing, and starter rows are not duplicated.",
  "",
  "SET NAMES utf8mb4;",
  "",
  ...tables.map((statement) => `${statement.trim()};\n`),
  "-- Starter subjects",
  ...STARTER_SUBJECTS.map(
    ([name, icon, description]) =>
      `INSERT IGNORE INTO subjects (name, description, icon, status) VALUES (${text(name)}, ${text(description)}, ${text(icon)}, 'active');`,
  ),
  "",
  "-- Starter plans (a plan is skipped when its name already exists)",
];

for (const plan of STARTER_PLANS) {
  lines.push(
    `INSERT IGNORE INTO plans (name, price, duration_months, status) VALUES (${text(plan.name)}, ${plan.price}, ${plan.durationMonths}, ${text(plan.status)});`,
  );
  plan.features.forEach((feature, index) => {
    lines.push(
      `INSERT IGNORE INTO plan_features (plan_id, position, feature) SELECT id, ${index + 1}, ${text(feature)} FROM plans WHERE name = ${text(plan.name)};`,
    );
  });
}

mkdirSync("sql", { recursive: true });
writeFileSync("sql/setup.sql", `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote sql/setup.sql (${tables.length} tables, ${STARTER_SUBJECTS.length} subjects, ${STARTER_PLANS.length} plans)`);
