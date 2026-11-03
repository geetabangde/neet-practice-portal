import type { MockTest, Question, TestResult, Topic } from "@/types";

// Small calculations that are used on more than one page

export function indexById<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

export function subjectStats(subjectId: string, topics: Topic[], questions: Question[]) {
  return {
    totalTopics: topics.filter((t) => t.subjectId === subjectId).length,
    totalQuestions: questions.filter((q) => q.subjectId === subjectId).length,
  };
}

export function topicQuestionCount(topicId: string, questions: Question[]): number {
  return questions.filter((q) => q.topicId === topicId).length;
}

export function testTotals(test: MockTest) {
  const totalQuestions = test.questionIds.length;
  return { totalQuestions, totalMarks: totalQuestions * test.marksPerQuestion };
}

// Share of attempted questions that were answered correctly, in percent
export function resultAccuracy(result: Pick<TestResult, "correct" | "incorrect">): number {
  const attempted = result.correct + result.incorrect;
  return attempted === 0 ? 0 : Math.round((result.correct / attempted) * 100);
}

// Colour band for a percentage, used by progress bars and badges
export function scoreTone(percent: number): "green" | "amber" | "red" {
  if (percent >= 70) return "green";
  if (percent >= 50) return "amber";
  return "red";
}
