import { apiRequest, type ApiResult } from "@/lib/api";

// Reading a spreadsheet of questions in the browser, and sending its rows to the backend.
// The backend checks every row again with the same rules as the question form: nothing here is trusted.

// The columns of the template, in order. Subject, module and topic are written by NAME, not by id.
export const IMPORT_COLUMNS = [
  "subject",
  "module",
  "topic",
  "question",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "correct",
  "explanation",
  "difficulty",
  "reference",
  "status",
] as const;
export type ImportColumn = (typeof IMPORT_COLUMNS)[number];

// A file without these four columns cannot work at all. The others are checked row by row (a draft needs only the text).
const REQUIRED_COLUMNS: ImportColumn[] = ["subject", "module", "topic", "question"];

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_ROWS = 2000;

export type ImportRow = Partial<Record<ImportColumn, string>>;

// Other names a column may have in someone's own spreadsheet. "Option A", "option-a" and "OPTION_A" all
// become "optiona" first (see simplify), so only one spelling of each is needed here.
const ALIASES: Record<string, ImportColumn> = {
  subject: "subject",
  module: "module",
  topic: "topic",
  question: "question",
  questiontext: "question",
  optiona: "option_a",
  optionb: "option_b",
  optionc: "option_c",
  optiond: "option_d",
  correct: "correct",
  correctanswer: "correct",
  correctoption: "correct",
  correctoptions: "correct",
  answer: "correct",
  explanation: "explanation",
  difficulty: "difficulty",
  level: "difficulty",
  reference: "reference",
  source: "reference",
  status: "status",
};

const simplify = (header: string) => header.toLowerCase().replace(/[^a-z0-9]/g, "");

// ---- CSV --------------------------------------------------------------------------------------

// Splits CSV text into rows of cells. Cells in "double quotes" may hold commas, line breaks and "" for a quote.
// The separator is a comma, or a semicolon when the header line uses semicolons (some Excel set-ups save that way).
export function parseCsv(text: string): string[][] {
  const source = text.replace(/^﻿/, "");
  const firstLine = source.split(/\r?\n/, 1)[0] ?? "";
  const separator = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === separator) {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  // The last line has no line break after it
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

// ---- Reading a file ---------------------------------------------------------------------------

export type ReadResult = { ok: true; rows: ImportRow[] } | { ok: false; message: string };

// Turns a grid of cells (the first line is the header) into rows with the standard column names
function rowsFromGrid(grid: string[][]): ReadResult {
  const header = grid[0];
  if (!header || header.every((cell) => cell.trim() === "")) return { ok: false, message: "The first row of the file must hold the column names." };

  const columnOf = header.map((title) => ALIASES[simplify(title)] ?? null);
  const missing = REQUIRED_COLUMNS.filter((name) => !columnOf.includes(name));
  if (missing.length > 0) {
    return { ok: false, message: `The file has no "${missing.join('", "')}" column. Download the template and use its column names.` };
  }

  const body = grid.slice(1);
  // Empty lines at the end are not questions. Empty lines in the middle stay, so row numbers match the spreadsheet.
  while (body.length > 0 && body[body.length - 1].every((cell) => cell.trim() === "")) body.pop();
  if (body.length === 0) return { ok: false, message: "The file has column names but no questions." };
  if (body.length > MAX_ROWS) return { ok: false, message: `The file has ${body.length} questions. The limit is ${MAX_ROWS} per file: split it into smaller files.` };

  const rows = body.map((cells) => {
    const row: ImportRow = {};
    columnOf.forEach((name, index) => {
      if (name) row[name] = (cells[index] ?? "").trim();
    });
    return row;
  });
  return { ok: true, rows };
}

export async function readQuestionFile(file: File): Promise<ReadResult> {
  if (file.size > MAX_FILE_BYTES) return { ok: false, message: "The file is bigger than 5 MB." };
  const name = file.name.toLowerCase();

  try {
    if (name.endsWith(".csv")) {
      return rowsFromGrid(parseCsv(await file.text()));
    }
    if (name.endsWith(".xlsx")) {
      // Loaded only when an Excel file is chosen, so the rest of the admin panel stays light
      const { readSheet } = await import("read-excel-file/browser");
      const sheet = await readSheet(file);
      return rowsFromGrid(sheet.map((row) => row.map((value) => (value === null || value === undefined ? "" : String(value)))));
    }
  } catch {
    return { ok: false, message: "The file could not be read. Check that it is a normal .csv or .xlsx file and try again." };
  }
  return { ok: false, message: "Choose a .csv or .xlsx file. (An old .xls file: open it in Excel and use Save As .xlsx.)" };
}

// ---- The template -----------------------------------------------------------------------------

const quote = (value: string) => (/[",\n\r;]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

// A CSV the admin can open in Excel: the column names and two example questions. The marker at the start
// makes Excel read the file as UTF-8, so special characters stay right.
export function questionTemplateCsv(example: { subject: string; module: string; topic: string }): string {
  const where = [example.subject, example.module, example.topic];
  const lines = [
    [...IMPORT_COLUMNS],
    [...where, "Which nerve supplies the deltoid muscle?", "Axillary nerve", "Radial nerve", "Ulnar nerve", "Median nerve", "A", "The deltoid is supplied by the axillary nerve.", "easy", "Textbook, chapter 3", "published"],
    [...where, "Which of these are branches of the brachial plexus? (two are correct)", "Musculocutaneous nerve", "Femoral nerve", "Radial nerve", "Sciatic nerve", "A,C", "The musculocutaneous and radial nerves arise from the brachial plexus.", "medium", "", "published"],
  ];
  return `﻿${lines.map((line) => line.map(quote).join(",")).join("\r\n")}\r\n`;
}

// Hands a text file to the browser as a download
export function downloadTextFile(fileName: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

// ---- Talking to the backend -------------------------------------------------------------------

export interface ImportProblem {
  row: number;
  message: string;
}

export interface ImportResult {
  dryRun: boolean;
  total: number;
  valid: number;
  imported: number;
  problems: ImportProblem[];
  created: { modules: number; topics: number };
}

// dryRun = true only checks the rows and reports; nothing is saved
export function importQuestionRows(rows: ImportRow[], options: { createMissing: boolean; dryRun: boolean }): Promise<ApiResult<ImportResult>> {
  return apiRequest<ImportResult>("/api/admin/questions/import", { method: "POST", body: { rows, ...options } });
}
