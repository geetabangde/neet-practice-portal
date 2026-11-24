import { apiRequest, type ApiResult } from "@/lib/api";
import type { TestResult } from "@/types";

// What the backend sends: numeric ids
interface ApiResultRow {
  id: number;
  studentId: number;
  testId: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  marksObtained: number;
  totalMarks: number;
  completedAt: string;
  timeTakenMinutes: number;
  rank: number;
}

// The admin panel keeps ids as strings everywhere
function toResult(row: ApiResultRow): TestResult {
  return { ...row, id: String(row.id), studentId: String(row.studentId), testId: String(row.testId) };
}

// Every finished test attempt of every student, newest first. Results are made by students taking tests, so they are read-only here.
export async function fetchResults(): Promise<ApiResult<TestResult[]>> {
  const result = await apiRequest<{ results: ApiResultRow[] }>("/api/admin/results");
  return result.ok ? { ok: true, data: result.data.results.map(toResult) } : result;
}
