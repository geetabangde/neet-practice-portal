import { downloadSampleZip, isPictureName, pictureKey } from "@/lib/import-bundle";
import { downloadTextFile, readGrid, simplify } from "@/lib/import-questions";
import type { TestQuestionFields } from "@/lib/test-questions-api";
import type { OptionKey } from "@/types";

// Reading a spreadsheet of questions for ONE test. There is no subject, module or topic column: the questions belong to the test.
// The backend checks every question again when they are saved.

export const MAX_TEST_ROWS = 500;

const COLUMNS = ["question", "option_a", "option_b", "option_c", "option_d", "correct", "explanation", "reference", "type", "image"] as const;
type Column = (typeof COLUMNS)[number];
const REQUIRED: Column[] = ["question", "option_a", "option_b", "option_c", "option_d", "correct"];

// Other names a column may have. "Option A", "option-a" and "OPTION_A" all become "optiona" first (see simplify).
const ALIASES: Record<string, Column> = {
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
  reference: "reference",
  source: "reference",
  type: "type",
  image: "image",
  imagename: "image",
  imagefile: "image",
  picture: "image",
  photo: "image",
};

export interface ReadProblem {
  // The row number as it is in the spreadsheet (the header is row 1)
  row: number;
  message: string;
}

// A question read from the file. "row" is its row in the spreadsheet; "imageFile" is the key of the picture it names (null when it has none).
export interface ImportedQuestion extends TestQuestionFields {
  row: number;
  imageFile: string | null;
}

export type TestFileResult =
  | { ok: true; questions: ImportedQuestion[]; problems: ReadProblem[] }
  | { ok: false; message: string };

// "A", "a", "A,C", "A and C", "A & C", "AC" -> ["A", "C"]. null when it is not a list of letters A to D.
function parseCorrect(text: string): OptionKey[] | null {
  const letters = text.toUpperCase().replace(/AND|[\s,;/&+]/g, "");
  if (letters === "" || !/^[ABCD]+$/.test(letters)) return null;
  return [...new Set(letters.split("") as OptionKey[])].sort();
}

export async function readTestQuestionFile(file: File): Promise<TestFileResult> {
  const read = await readGrid(file);
  if (!read.ok) return read;
  const header = read.grid[0];
  if (!header || header.every((cell) => cell.trim() === "")) return { ok: false, message: "The first row of the file must hold the column names." };

  const columnOf = header.map((title) => ALIASES[simplify(title)] ?? null);
  const missing = REQUIRED.filter((name) => !columnOf.includes(name));
  if (missing.length > 0) return { ok: false, message: `The file has no "${missing.join('", "')}" column. Download the template and use its column names.` };

  const body = read.grid.slice(1);
  while (body.length > 0 && body[body.length - 1].every((cell) => cell.trim() === "")) body.pop();
  if (body.length === 0) return { ok: false, message: "The file has column names but no questions." };
  if (body.length > MAX_TEST_ROWS) return { ok: false, message: `The file has ${body.length} questions. The limit is ${MAX_TEST_ROWS} per file: split it into smaller files.` };

  const questions: ImportedQuestion[] = [];
  const problems: ReadProblem[] = [];
  body.forEach((cells, index) => {
    const row = index + 2;
    const value: Partial<Record<Column, string>> = {};
    columnOf.forEach((name, i) => {
      if (name) value[name] = (cells[i] ?? "").trim();
    });
    // An empty line in the middle is skipped
    if (cells.every((cell) => cell.trim() === "")) return;

    const fail = (message: string) => problems.push({ row, message });
    if (!value.question) return fail("The question is empty.");
    const options = {} as Record<OptionKey, string>;
    for (const key of ["A", "B", "C", "D"] as const) {
      const option = value[`option_${key.toLowerCase()}` as Column];
      if (!option) return fail(`Option ${key} is empty.`);
      options[key] = option;
    }
    const correct = parseCorrect(value.correct ?? "");
    if (!correct) return fail('The "correct" column must hold letters from A to D, like A or A,C.');

    const asked = (value.type ?? "").toLowerCase();
    if (asked !== "" && asked !== "single" && asked !== "multiple") return fail('The "type" column must be single or multiple (or empty).');
    // When the type is not given, two or more right options make it a "multiple" question
    const type = asked === "" ? (correct.length > 1 ? "multiple" : "single") : asked;
    if (type === "single" && correct.length !== 1) return fail("A single-answer question has exactly one right option.");
    if (type === "multiple" && correct.length < 2) return fail("A multiple-answer question needs at least two right options.");

    // The picture of the question is named in the "image" column. It comes in the zip or is chosen next to the file.
    const imageName = (value.image ?? "").trim();
    if (imageName !== "" && !isPictureName(imageName)) return fail('The "image" column must name a PNG, JPG, WebP or GIF file, like xray.png.');
    questions.push({
      text: value.question,
      type,
      options,
      correct,
      explanation: value.explanation ?? "",
      reference: value.reference ?? "",
      imageName,
      imageToken: null,
      sectionId: null,
      imageFile: imageName === "" ? null : pictureKey(imageName),
      row,
    });
  });
  return { ok: true, questions, problems };
}

const quote = (value: string) => (/[",\n\r;]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

// The template: the column names and three example questions. The "image" column names a picture of the question (or is empty).
export function testQuestionTemplateText(): string {
  const lines = [
    [...COLUMNS],
    ["Which nerve supplies the deltoid muscle?", "Axillary nerve", "Radial nerve", "Ulnar nerve", "Median nerve", "A", "The deltoid is supplied by the axillary nerve.", "Textbook, chapter 3", "", "sample-1.png"],
    ["Which of these are branches of the brachial plexus? (two are correct)", "Musculocutaneous nerve", "Femoral nerve", "Radial nerve", "Sciatic nerve", "A,C", "The musculocutaneous and radial nerves arise from the brachial plexus.", "", "multiple", "sample-2.png"],
    ["A question without a picture: leave the image column empty", "Option A", "Option B", "Option C", "Option D", "B", "", "", "", ""],
  ];
  return `\uFEFF${lines.map((line) => line.map(quote).join(",")).join("\r\n")}\r\n`;
}

// Only the spreadsheet (a CSV the admin can open in Excel)
export function downloadTestQuestionTemplate(): void {
  downloadTextFile("test-questions-template.csv", testQuestionTemplateText());
}

// A .zip with the template AND the two sample pictures it names. Fill the spreadsheet, put your pictures next to it,
// zip them and import the zip: each question gets the picture named in its "image" column.
export async function downloadTestQuestionSample(): Promise<void> {
  await downloadSampleZip("test-questions-sample.zip", "test-questions.csv", testQuestionTemplateText(), ["sample-1.png", "sample-2.png"]);
}
