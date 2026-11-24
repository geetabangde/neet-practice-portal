import type { Request, Response } from "express";
import { listResults } from "../services/result.service";

// GET /api/admin/results  ->  every finished test attempt, newest first
export async function listResultsHandler(_req: Request, res: Response): Promise<void> {
  try {
    res.json({ success: true, message: "Results", data: { results: await listResults() } });
  } catch (error) {
    console.error("List results failed:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
}
