import type { MockTest, Question, TestStatus } from "@/types";
import { daysAfter, daysBefore } from "./helpers";
import { questionsData } from "./questions";

interface TestSeed {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  startAt: string;
  endAt: string;
  status: TestStatus;
}

const unique = (values: string[]) => [...new Set(values)];

// Subjects, topics and the question list are worked out from the chosen questions,
// so a test can never point to a subject it has no question from.
function makeTest(seed: TestSeed): MockTest {
  return {
    id: seed.id,
    title: seed.title,
    description: seed.description,
    subjectIds: unique(seed.questions.map((q) => q.subjectId)),
    topicIds: unique(seed.questions.map((q) => q.topicId)),
    questionIds: seed.questions.map((q) => q.id),
    durationMinutes: seed.questions.length * 2,
    marksPerQuestion: 4,
    negativeMarking: 1,
    startAt: seed.startAt,
    endAt: seed.endAt,
    status: seed.status,
  };
}

const inSubject = (subjectId: string) => questionsData.filter((q) => q.subjectId === subjectId);

export const testsData: MockTest[] = [
  makeTest({
    id: "t-001",
    title: "Grand Test 1 - INICET Pattern",
    description: "Full-length mock in the INICET pattern (demo description).",
    questions: questionsData.slice(0, 30),
    startAt: `${daysBefore(52)}T10:00`,
    endAt: `${daysBefore(52)}T13:00`,
    status: "completed",
  }),
  makeTest({
    id: "t-002",
    title: "Grand Test 2 - NEET Pattern",
    description: "Full-length mock in the NEET pattern (demo description).",
    questions: questionsData.slice(10, 40),
    startAt: `${daysBefore(38)}T10:00`,
    endAt: `${daysBefore(38)}T13:00`,
    status: "completed",
  }),
  makeTest({
    id: "t-003",
    title: "Grand Test 3 - INICET Pattern",
    description: "Full-length mock in the INICET pattern (demo description).",
    questions: questionsData.slice(20, 50),
    startAt: `${daysBefore(24)}T10:00`,
    endAt: `${daysBefore(24)}T13:00`,
    status: "completed",
  }),
  makeTest({
    id: "t-004",
    title: "National INI-CET Mock 2025 Nov Session",
    description: "National level mock, open for a week (demo description).",
    questions: questionsData.slice(5, 45),
    startAt: `${daysBefore(2)}T09:00`,
    endAt: `${daysAfter(6)}T21:00`,
    status: "published",
  }),
  makeTest({
    id: "t-005",
    title: "Grand Test 4 - NEET Pattern",
    description: "Next full-length mock (demo description).",
    questions: questionsData.slice(30, 60),
    startAt: `${daysAfter(9)}T10:00`,
    endAt: `${daysAfter(9)}T13:00`,
    status: "published",
  }),
  makeTest({
    id: "t-006",
    title: "Biochemistry Subject Test",
    description: "One-subject practice test (demo description).",
    questions: inSubject("s-003").slice(0, 15),
    startAt: `${daysBefore(10)}T08:00`,
    endAt: `${daysAfter(20)}T23:00`,
    status: "published",
  }),
  makeTest({
    id: "t-007",
    title: "Grand Test 5 - NEET Pattern",
    description: "Draft. Questions still being chosen (demo description).",
    questions: questionsData.slice(40, 70),
    startAt: `${daysAfter(23)}T10:00`,
    endAt: `${daysAfter(23)}T13:00`,
    status: "draft",
  }),
  makeTest({
    id: "t-008",
    title: "Pharmacology Mini Test",
    description: "Draft mini test (demo description).",
    questions: inSubject("s-005"),
    startAt: `${daysAfter(30)}T16:00`,
    endAt: `${daysAfter(30)}T17:00`,
    status: "draft",
  }),
  makeTest({
    id: "t-009",
    title: "Anatomy Mini Test",
    description: "Short subject test that has already ended (demo description).",
    questions: inSubject("s-001"),
    startAt: `${daysBefore(16)}T18:00`,
    endAt: `${daysBefore(16)}T19:30`,
    status: "completed",
  }),
];
