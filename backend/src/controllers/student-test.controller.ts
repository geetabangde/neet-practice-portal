import type { Request, Response } from "express";
import { listStudentTests } from "../services/test.service";

// GET /api/student/tests  ->  the tests of the Test Series (published and completed ones that have questions)
export async function listStudentTestsHandler(_req: Request, res: Response): Promise<void> {
  try {
    res.json({ success: true, message: "Tests", data: { tests: await listStudentTests() } });
  } catch (error) {
    console.error("List student tests failed:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
}
