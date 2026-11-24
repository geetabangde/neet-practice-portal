import type { Request, Response } from "express";
import { hasPaidPlan, needsPaidPlan } from "../services/student-plan.service";
import { listStudentTests } from "../services/test.service";

// GET /api/student/tests  ->  the tests of the Test Series (published and completed ones that have questions).
// Each test says whether it is locked for this student: Mini and Subject tests need a paid plan.
export async function listStudentTestsHandler(_req: Request, res: Response): Promise<void> {
  try {
    const studentId = (res.locals.student as { id: number }).id;
    const [tests, paid] = await Promise.all([listStudentTests(), hasPaidPlan(studentId)]);
    res.json({
      success: true,
      message: "Tests",
      data: { tests: tests.map((test) => ({ ...test, locked: !paid && needsPaidPlan(test.kind) })) },
    });
  } catch (error) {
    console.error("List student tests failed:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
}
