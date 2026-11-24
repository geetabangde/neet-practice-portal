import type { RowDataPacket } from "mysql2/promise";
import { pool } from "../config/db";

// One finished test attempt, as the admin Test Results screen shows it
export interface AdminResult {
  id: number;
  studentId: number;
  testId: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  marksObtained: number;
  totalMarks: number;
  // YYYY-MM-DD
  completedAt: string;
  timeTakenMinutes: number;
  // Place among the students who finished the same test (1 = best)
  rank: number;
}

interface AttemptRow extends RowDataPacket {
  id: number;
  testId: number;
  studentId: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  score: string;
  totalMarks: string;
  completedAt: string;
  seconds: number;
  durationMinutes: number;
}

// The newest finished attempts first. An attempt that is still running has no result yet.
const MAX_RESULTS = 2000;

export async function listResults(): Promise<AdminResult[]> {
  const [attempts] = await pool.query<AttemptRow[]>(
    `SELECT a.id, a.test_id AS testId, a.student_id AS studentId, a.correct, a.incorrect, a.unattempted,
            a.score, a.total_marks AS totalMarks, DATE_FORMAT(a.submitted_at, '%Y-%m-%d') AS completedAt,
            TIMESTAMPDIFF(SECOND, a.started_at, a.submitted_at) AS seconds,
            CAST(t.duration_minutes AS SIGNED) AS durationMinutes
       FROM test_attempts a JOIN tests t ON t.id = a.test_id
      WHERE a.submitted_at IS NOT NULL ORDER BY a.submitted_at DESC, a.id DESC LIMIT ?`,
    [MAX_RESULTS],
  );

  // Rank: 1 + the number of students who finished the same test with more marks
  const scoresOf = new Map<number, number[]>();
  for (const a of attempts) scoresOf.set(a.testId, [...(scoresOf.get(a.testId) ?? []), Number(a.score)]);

  return attempts.map((a) => {
    const score = Number(a.score);
    return {
      id: a.id,
      studentId: a.studentId,
      testId: a.testId,
      correct: a.correct,
      incorrect: a.incorrect,
      unattempted: a.unattempted,
      marksObtained: score,
      totalMarks: Number(a.totalMarks),
      completedAt: a.completedAt,
      // At least a minute, and never more than the test allows (an attempt is closed when the student comes back, not at the exact end)
      timeTakenMinutes: Math.min(a.durationMinutes, Math.max(1, Math.ceil(a.seconds / 60))),
      rank: (scoresOf.get(a.testId) ?? []).filter((s) => s > score).length + 1,
    };
  });
}
