// Writes sql/demo-data.sql: the demo modules, topics, QBank questions, tests and test questions as plain SQL,
// to import in phpMyAdmin AFTER sql/setup.sql (the live site has no terminal for "npm run seed:demo").
// Everything is found by NAME, never by id, so the ids of the live database do not matter, and importing the file
// twice does not add anything twice. Run with: npm run db:export-demo
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { escape } from "mysql2";
import type { RowDataPacket } from "mysql2";
import { pool } from "../config/db";

const q = (value: string | number | null) => escape(value);

const lines: string[] = [
  "-- NEET PG practice portal: DEMO DATA for phpMyAdmin (sample modules, topics, QBank questions, tests and test questions).",
  "-- Import sql/setup.sql FIRST, then this file. Open phpMyAdmin, pick your database, Import, choose this file.",
  "-- Safe to import again: nothing is added twice. The subjects come from setup.sql.",
  "-- Test dates are counted from the day you import (some tests are open now, one is coming soon, some are finished).",
  "-- Every demo question starts with [Demo], so it is easy to find and delete in the admin panel.",
  "",
  "SET NAMES utf8mb4;",
  "",
];

async function main(): Promise<void> {
  // ---- modules
  const [modules] = await pool.query<(RowDataPacket & { subject: string; name: string; status: string })[]>(
    "SELECT s.name AS subject, m.name, m.status FROM modules m JOIN subjects s ON s.id = m.subject_id ORDER BY s.id, m.id",
  );
  lines.push("-- Modules");
  for (const m of modules) {
    lines.push(
      `INSERT INTO modules (subject_id, name, status) SELECT s.id, ${q(m.name)}, ${q(m.status)} FROM subjects s WHERE s.name = ${q(m.subject)} AND NOT EXISTS (SELECT 1 FROM modules x WHERE x.subject_id = s.id AND x.name = ${q(m.name)});`,
    );
  }

  // ---- topics
  const [topics] = await pool.query<(RowDataPacket & { subject: string; module: string; name: string; minutes: number; status: string })[]>(
    `SELECT s.name AS subject, m.name AS module, t.name, t.duration_minutes AS minutes, t.status
       FROM topics t JOIN modules m ON m.id = t.module_id JOIN subjects s ON s.id = m.subject_id ORDER BY s.id, m.id, t.id`,
  );
  lines.push("", "-- Topics");
  for (const t of topics) {
    lines.push(
      `INSERT INTO topics (subject_id, module_id, name, duration_minutes, status) SELECT m.subject_id, m.id, ${q(t.name)}, ${q(t.minutes)}, ${q(t.status)} FROM modules m JOIN subjects s ON s.id = m.subject_id WHERE s.name = ${q(t.subject)} AND m.name = ${q(t.module)} AND NOT EXISTS (SELECT 1 FROM topics x WHERE x.module_id = m.id AND x.name = ${q(t.name)});`,
    );
  }

  // ---- QBank questions (only the demo ones, they start with [Demo])
  const [questions] = await pool.query<
    (RowDataPacket & { subject: string | null; module: string | null; topic: string | null; text: string; difficulty: string; type: string; a: string; b: string; c: string; d: string; correct: string; explanation: string; reference: string; image: string; status: string })[]
  >(
    `SELECT s.name AS subject, m.name AS module, t.name AS topic, q.question_text AS text, q.difficulty, q.type, q.option_a AS a, q.option_b AS b,
            q.option_c AS c, q.option_d AS d, q.correct, q.explanation, q.reference_text AS reference, q.image_name AS image, q.status
       FROM questions q LEFT JOIN topics t ON t.id = q.topic_id LEFT JOIN modules m ON m.id = t.module_id LEFT JOIN subjects s ON s.id = q.subject_id
      WHERE q.question_text LIKE '[Demo]%' ORDER BY q.id`,
  );
  lines.push("", "-- QBank questions");
  for (const x of questions) {
    if (x.subject === null || x.module === null || x.topic === null) continue;
    lines.push(
      `INSERT INTO questions (subject_id, topic_id, question_text, difficulty, type, option_a, option_b, option_c, option_d, correct, explanation, reference_text, image_name, status) ` +
        `SELECT t.subject_id, t.id, ${q(x.text)}, ${q(x.difficulty)}, ${q(x.type)}, ${q(x.a)}, ${q(x.b)}, ${q(x.c)}, ${q(x.d)}, ${q(x.correct)}, ${q(x.explanation)}, ${q(x.reference)}, ${q(x.image)}, ${q(x.status)} ` +
        `FROM topics t JOIN modules m ON m.id = t.module_id JOIN subjects s ON s.id = m.subject_id WHERE s.name = ${q(x.subject)} AND m.name = ${q(x.module)} AND t.name = ${q(x.topic)} ` +
        `AND NOT EXISTS (SELECT 1 FROM questions y WHERE y.question_text = ${q(x.text)});`,
    );
  }

  // ---- tests. Dates are worked out from the day the test was made: "1 day before today at 09:00" stays that way.
  const [tests] = await pool.query<
    (RowDataPacket & { id: number; title: string; description: string; kind: string; pattern: string; minutes: number; marks: string; ratio: string; negative: string; startDays: number; startTime: string; endDays: number; endTime: string; status: string })[]
  >(
    `SELECT id, title, description, kind, pattern, duration_minutes AS minutes, marks_per_question AS marks, negative_ratio AS ratio, negative_marking AS negative,
            DATEDIFF(DATE(start_at), DATE(created_at)) AS startDays, TIME_FORMAT(start_at, '%H:%i:%s') AS startTime,
            DATEDIFF(DATE(end_at), DATE(created_at)) AS endDays, TIME_FORMAT(end_at, '%H:%i:%s') AS endTime, status
       FROM tests WHERE title LIKE '[Demo]%' ORDER BY id`,
  );
  const at = (days: number, time: string) => `TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL ${Math.trunc(days)} DAY), ${q(time)})`;
  lines.push("", "-- Tests");
  for (const t of tests) {
    lines.push(
      `INSERT INTO tests (title, description, kind, pattern, duration_minutes, marks_per_question, negative_ratio, negative_marking, start_at, end_at, status) ` +
        `SELECT ${q(t.title)}, ${q(t.description)}, ${q(t.kind)}, ${q(t.pattern)}, ${q(t.minutes)}, ${q(Number(t.marks))}, ${q(t.ratio)}, ${q(Number(t.negative))}, ${at(t.startDays, t.startTime)}, ${at(t.endDays, t.endTime)}, ${q(t.status)} ` +
        `FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tests x WHERE x.title = ${q(t.title)});`,
    );
  }

  // ---- the questions written inside each test
  lines.push("", "-- Test questions (each test has its own, separate from the QBank)");
  for (const t of tests) {
    const [paper] = await pool.query<(RowDataPacket & { position: number; text: string; type: string; a: string; b: string; c: string; d: string; correct: string; explanation: string; reference: string })[]>(
      `SELECT position, question_text AS text, type, option_a AS a, option_b AS b, option_c AS c, option_d AS d, correct, explanation, reference_text AS reference
         FROM test_series_questions WHERE test_id = ? ORDER BY position`,
      [t.id],
    );
    for (const x of paper) {
      lines.push(
        `INSERT INTO test_series_questions (test_id, position, question_text, type, option_a, option_b, option_c, option_d, correct, explanation, reference_text) ` +
          `SELECT t.id, ${q(x.position)}, ${q(x.text)}, ${q(x.type)}, ${q(x.a)}, ${q(x.b)}, ${q(x.c)}, ${q(x.d)}, ${q(x.correct)}, ${q(x.explanation)}, ${q(x.reference)} ` +
          `FROM tests t WHERE t.title = ${q(t.title)} AND NOT EXISTS (SELECT 1 FROM test_series_questions y WHERE y.test_id = t.id AND y.position = ${q(x.position)});`,
      );
    }
  }
  lines.push("");

  const file = join(__dirname, "..", "..", "sql", "demo-data.sql");
  writeFileSync(file, lines.join("\n"), "utf8");
  console.log(`Wrote sql/demo-data.sql: ${modules.length} modules, ${topics.length} topics, ${questions.length} QBank questions, ${tests.length} tests.`);
}

main()
  .catch((error: unknown) => {
    console.error("Export failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
