import type { SubjectScore, TestResult } from "@/types";
import { daysBefore, pad, pick } from "./helpers";
import { questionsData } from "./questions";
import { studentsData } from "./students";
import { testsData } from "./tests";

const questionById = new Map(questionsData.map((q) => [q.id, q]));

// Only tests that were open to students can have results
const attemptableTests = testsData.filter((t) => t.status !== "draft");

export const resultsData: TestResult[] = Array.from({ length: 56 }, (_, i) => {
  const test = pick(attemptableTests, i);
  const student = studentsData[(i * 5) % studentsData.length];

  // Accuracy target for this attempt: 35% to 89%
  const accuracy = 35 + ((i * 29) % 55);

  // Count the test's questions per subject, then split correct / incorrect / unattempted
  const totals = new Map<string, number>();
  for (const questionId of test.questionIds) {
    const subjectId = questionById.get(questionId)?.subjectId ?? "";
    totals.set(subjectId, (totals.get(subjectId) ?? 0) + 1);
  }

  const subjectScores: SubjectScore[] = [...totals].map(([subjectId, total]) => {
    const correct = Math.round((total * accuracy * 0.85) / 100);
    const incorrect = Math.min(total - correct, Math.round((total * (100 - accuracy) * 0.6) / 100));
    return { subjectId, correct, incorrect, unattempted: total - correct - incorrect };
  });

  // The attempt totals are the sums of the subject numbers, so both always agree
  const correct = subjectScores.reduce((sum, s) => sum + s.correct, 0);
  const incorrect = subjectScores.reduce((sum, s) => sum + s.incorrect, 0);
  const unattempted = subjectScores.reduce((sum, s) => sum + s.unattempted, 0);

  return {
    id: `r-${pad(i + 1)}`,
    studentId: student.id,
    testId: test.id,
    correct,
    incorrect,
    unattempted,
    marksObtained: correct * test.marksPerQuestion - incorrect * test.negativeMarking,
    totalMarks: test.questionIds.length * test.marksPerQuestion,
    completedAt: daysBefore(i % 40),
    timeTakenMinutes: Math.round(test.durationMinutes * (0.6 + ((i * 7) % 35) / 100)),
    rank: 1 + ((i * 3) % 60),
    subjectScores,
  };
});
