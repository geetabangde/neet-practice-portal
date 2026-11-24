import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../config/db";
import {
  findQuestionProblem,
  questionValues,
  type Difficulty,
  type OptionKey,
  type QuestionInput,
  type QuestionStatus,
} from "./question.service";

// Bulk import: a spreadsheet of questions becomes questions in the database.
// The website reads the file and sends its rows here as plain text cells. This checks every row with the same
// rules as the question form, skips the rows that have a problem, and saves the rest in one go.

export const MAX_IMPORT_ROWS = 2000;

export interface ImportProblem {
  // The row number as the admin sees it in the spreadsheet (row 1 is the header, so the first question is row 2)
  row: number;
  message: string;
}

export interface ImportResult {
  dryRun: boolean;
  total: number;
  // Rows that passed every check
  valid: number;
  // Rows saved. Always 0 on a check-only run.
  imported: number;
  problems: ImportProblem[];
  // Modules and topics that were (or, on a check-only run, would be) created
  created: { modules: number; topics: number };
}

type RawRow = Record<string, unknown>;

interface Named extends RowDataPacket {
  id: number;
  name: string;
}

// A module or topic is pointed at either by its database id ("id:5") or, when this import is about to
// create it, by the name it will get ("new:...")
type Ref = string;

interface PlannedModule {
  subjectId: number;
  name: string;
}

interface PlannedTopic {
  moduleRef: Ref;
  subjectId: number;
  name: string;
}

interface ValidRow {
  rowNumber: number;
  topicRef: Ref;
  input: QuestionInput;
}

const lower = (text: string) => text.toLowerCase();

function cell(row: RawRow, key: string): string {
  const value = row[key];
  return value === undefined || value === null ? "" : String(value).trim();
}

// "A", "A,C", "a; c", "AC"  ->  ["A","C"]. null when the text is not made of the letters A to D.
function parseCorrect(text: string): OptionKey[] | null {
  if (text === "") return [];
  if (!/^[A-Da-d]([\s,;&/|]*[A-Da-d])*$/.test(text)) return null;
  return [...new Set(text.toUpperCase().match(/[A-D]/g) as OptionKey[])].sort();
}

// Runs the steps as one unit: if any of them fails, none of them is kept
async function inTransaction<T>(work: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function importQuestions(rows: RawRow[], options: { createMissing: boolean; dryRun: boolean }): Promise<ImportResult> {
  // ---- What exists now: subjects, modules and topics by name
  const [subjects] = await pool.query<Named[]>("SELECT id, name FROM subjects");
  const [modules] = await pool.query<(Named & { subject_id: number })[]>("SELECT id, subject_id, name FROM modules");
  const [topics] = await pool.query<(Named & { module_id: number })[]>("SELECT id, module_id, name FROM topics");

  const subjectByName = new Map(subjects.map((s) => [lower(s.name), s]));
  const moduleId = new Map(modules.map((m) => [`${m.subject_id}|${lower(m.name)}`, m.id]));
  const topicId = new Map(topics.map((t) => [`${t.module_id}|${lower(t.name)}`, t.id]));

  const plannedModules = new Map<Ref, PlannedModule>();
  const plannedTopics = new Map<Ref, PlannedTopic>();
  const problems: ImportProblem[] = [];
  const candidates: ValidRow[] = [];

  // ---- Check every row
  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const fail = (message: string) => {
      problems.push({ row: rowNumber, message });
    };

    const text = cell(row, "question");
    if (text === "") return fail("The question text is empty.");
    if (text.length > 1000) return fail("The question text is longer than 1000 characters.");

    const subjectName = cell(row, "subject");
    const subject = subjectByName.get(lower(subjectName));
    if (subjectName === "") return fail("The subject is empty.");
    if (!subject) return fail(`Subject "${subjectName}" does not exist. Subjects are not created by the import: add it in the Subjects page first.`);

    const moduleName = cell(row, "module");
    if (moduleName === "") return fail("The module is empty.");
    let moduleRef: Ref;
    const knownModule = moduleId.get(`${subject.id}|${lower(moduleName)}`);
    if (knownModule !== undefined) {
      moduleRef = `id:${knownModule}`;
    } else if (options.createMissing) {
      moduleRef = `new:${subject.id}|${lower(moduleName)}`;
      if (!plannedModules.has(moduleRef)) plannedModules.set(moduleRef, { subjectId: subject.id, name: moduleName });
    } else {
      return fail(`Module "${moduleName}" does not exist in ${subject.name}. Tick "Create missing modules and topics", or add it first.`);
    }

    const topicName = cell(row, "topic");
    if (topicName === "") return fail("The topic is empty.");
    let topicRef: Ref;
    const knownTopic = moduleRef.startsWith("id:") ? topicId.get(`${moduleRef.slice(3)}|${lower(topicName)}`) : undefined;
    if (knownTopic !== undefined) {
      topicRef = `id:${knownTopic}`;
    } else if (options.createMissing) {
      topicRef = `new:${moduleRef}|${lower(topicName)}`;
      if (!plannedTopics.has(topicRef)) plannedTopics.set(topicRef, { moduleRef, subjectId: subject.id, name: topicName });
    } else {
      return fail(`Topic "${topicName}" does not exist in the module "${moduleName}". Tick "Create missing modules and topics", or add it first.`);
    }

    const difficulty = (cell(row, "difficulty") || "medium").toLowerCase();
    if (difficulty !== "easy" && difficulty !== "medium" && difficulty !== "hard") return fail(`Difficulty "${cell(row, "difficulty")}" must be easy, medium or hard.`);

    const status = (cell(row, "status") || "published").toLowerCase();
    if (status !== "published" && status !== "draft") return fail(`Status "${cell(row, "status")}" must be published or draft.`);

    const optionTexts = { A: cell(row, "option_a"), B: cell(row, "option_b"), C: cell(row, "option_c"), D: cell(row, "option_d") };
    for (const key of ["A", "B", "C", "D"] as const) {
      if (optionTexts[key].length > 500) return fail(`Option ${key} is longer than 500 characters.`);
    }

    const correct = parseCorrect(cell(row, "correct"));
    if (correct === null) return fail(`Correct answer "${cell(row, "correct")}" must be letters A to D, like A or A,C.`);

    const explanation = cell(row, "explanation");
    if (explanation.length > 5000) return fail("The explanation is longer than 5000 characters.");
    const reference = cell(row, "reference");
    if (reference.length > 255) return fail("The reference is longer than 255 characters.");

    // topicId 0 stands in until the topic has its real id; the rules only ask that a topic is there
    const input: QuestionInput = {
      subjectId: subject.id,
      topicId: 0,
      text,
      difficulty: difficulty as Difficulty,
      type: correct.length > 1 ? "multiple" : "single",
      options: optionTexts,
      correct,
      explanation,
      reference,
      imageName: "",
      imageToken: null,
      status: status as QuestionStatus,
    };
    const problem = findQuestionProblem(input);
    if (problem) return fail(`${problem}.`);

    candidates.push({ rowNumber, topicRef, input });
  });

  // ---- Skip questions that already exist in the same topic, or appear twice in the file
  const existing = new Set<string>();
  const knownTopicIds = [...new Set(candidates.filter((c) => c.topicRef.startsWith("id:")).map((c) => Number(c.topicRef.slice(3))))];
  if (knownTopicIds.length > 0) {
    const [found] = await pool.query<(RowDataPacket & { topic_id: number; question_text: string })[]>(
      "SELECT topic_id, question_text FROM questions WHERE topic_id IN (?)",
      [knownTopicIds],
    );
    for (const row of found) existing.add(`id:${row.topic_id}|${lower(row.question_text)}`);
  }
  const seenInFile = new Map<string, number>();
  const valid: ValidRow[] = [];
  for (const candidate of candidates) {
    const key = `${candidate.topicRef}|${lower(candidate.input.text)}`;
    if (existing.has(key)) {
      problems.push({ row: candidate.rowNumber, message: "This question already exists in this topic, so it was skipped." });
    } else if (seenInFile.has(key)) {
      problems.push({ row: candidate.rowNumber, message: `The same question is already in this file (row ${seenInFile.get(key)}), so it was skipped.` });
    } else {
      seenInFile.set(key, candidate.rowNumber);
      valid.push(candidate);
    }
  }
  problems.sort((a, b) => a.row - b.row);

  // Only the modules and topics that a valid row really needs are created
  const neededTopics = new Set(valid.map((v) => v.topicRef).filter((ref) => ref.startsWith("new:")));
  const neededModules = new Set<Ref>();
  for (const ref of neededTopics) {
    const moduleRef = plannedTopics.get(ref)?.moduleRef;
    if (moduleRef?.startsWith("new:")) neededModules.add(moduleRef);
  }
  const created = { modules: neededModules.size, topics: neededTopics.size };

  const result: ImportResult = { dryRun: options.dryRun, total: rows.length, valid: valid.length, imported: 0, problems, created };
  if (options.dryRun || valid.length === 0) return result;

  // ---- Save: new modules and topics first, then the questions, all or nothing
  await inTransaction(async (connection) => {
    const newModuleIds = new Map<Ref, number>();
    for (const ref of neededModules) {
      const planned = plannedModules.get(ref) as PlannedModule;
      const [made] = await connection.query<ResultSetHeader>("INSERT INTO modules (subject_id, name, status) VALUES (?, ?, 'active')", [planned.subjectId, planned.name]);
      newModuleIds.set(ref, made.insertId);
    }

    const newTopicIds = new Map<Ref, number>();
    for (const ref of neededTopics) {
      const planned = plannedTopics.get(ref) as PlannedTopic;
      const moduleIdValue = planned.moduleRef.startsWith("id:") ? Number(planned.moduleRef.slice(3)) : (newModuleIds.get(planned.moduleRef) as number);
      const [made] = await connection.query<ResultSetHeader>(
        "INSERT INTO topics (subject_id, module_id, name, status) VALUES (?, ?, ?, 'active')",
        [planned.subjectId, moduleIdValue, planned.name],
      );
      newTopicIds.set(ref, made.insertId);
    }

    const values = valid.map((v) => {
      const realTopicId = v.topicRef.startsWith("id:") ? Number(v.topicRef.slice(3)) : (newTopicIds.get(v.topicRef) as number);
      return questionValues({ ...v.input, topicId: realTopicId });
    });
    // Many rows in one INSERT is much faster than one INSERT per row; 200 at a time keeps each statement small
    for (let start = 0; start < values.length; start += 200) {
      await connection.query(
        `INSERT INTO questions (subject_id, topic_id, question_text, difficulty, type, option_a, option_b, option_c, option_d,
           correct, explanation, reference_text, image_name, image_token, status) VALUES ?`,
        [values.slice(start, start + 200)],
      );
    }
  });

  return { ...result, imported: valid.length };
}
