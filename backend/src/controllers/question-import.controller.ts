import type { Request, Response } from "express";
import { MAX_IMPORT_ROWS, importQuestions } from "../services/question-import.service";

// POST /api/admin/questions/import
// body: { rows: [ { subject, module, topic, question, option_a, ... }, ... ], createMissing?: boolean, dryRun?: boolean }
// dryRun: true only checks the rows and reports what would happen; nothing is saved.
export async function importQuestionsHandler(req: Request, res: Response): Promise<void> {
  const body: unknown = req.body;
  const data = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

  const rows = data.rows;
  if (!Array.isArray(rows) || rows.length === 0) {
    res.status(400).json({ success: false, message: "The file has no question rows." });
    return;
  }
  if (rows.length > MAX_IMPORT_ROWS) {
    res.status(400).json({ success: false, message: `A file can have at most ${MAX_IMPORT_ROWS} questions. Split it into smaller files.` });
    return;
  }
  if (!rows.every((row) => typeof row === "object" && row !== null && !Array.isArray(row))) {
    res.status(400).json({ success: false, message: "The rows are not in the expected form." });
    return;
  }

  const dryRun = data.dryRun === true;
  try {
    const result = await importQuestions(rows as Record<string, unknown>[], { createMissing: data.createMissing === true, dryRun });
    const message = dryRun
      ? `${result.valid} of ${result.total} rows are ready to import.`
      : `${result.imported} questions imported.`;
    res.json({ success: true, message, data: result });
  } catch (error) {
    // 1062 = a module or topic with the same name was made by someone else while this import was running
    if (typeof error === "object" && error !== null && "errno" in error && error.errno === 1062) {
      res.status(409).json({ success: false, message: "The modules or topics changed while importing. Nothing was saved. Check the file again." });
      return;
    }
    console.error("Question import failed:", error);
    res.status(500).json({ success: false, message: "Something went wrong. Nothing was saved." });
  }
}
