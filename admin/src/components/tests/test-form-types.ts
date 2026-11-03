import type { MockTest } from "@/types";

// What the test wizard keeps while the admin fills it in. Numbers are kept as text,
// because that is what a text box holds; they are turned into numbers when saving.
export interface TestFormValues {
  title: string;
  description: string;
  durationMinutes: string;
  marksPerQuestion: string;
  negativeMarking: string;
  // YYYY-MM-DDTHH:mm, as given by <input type="datetime-local">
  startAt: string;
  endAt: string;
  subjectIds: string[];
  topicIds: string[];
  questionIds: string[];
}

export type TestFormErrors = Partial<
  Record<"title" | "durationMinutes" | "marksPerQuestion" | "startAt" | "endAt" | "scope" | "questions", string>
>;

export interface StepProps {
  values: TestFormValues;
  errors: TestFormErrors;
  update: (patch: Partial<TestFormValues>) => void;
}

export const STEPS = ["Basics", "Subjects & topics", "Questions", "Review"];

export const emptyTestForm: TestFormValues = {
  title: "",
  description: "",
  durationMinutes: "180",
  marksPerQuestion: "4",
  negativeMarking: "1",
  startAt: "",
  endAt: "",
  subjectIds: [],
  topicIds: [],
  questionIds: [],
};

export function formFromTest(test: MockTest): TestFormValues {
  return {
    title: test.title,
    description: test.description,
    durationMinutes: String(test.durationMinutes),
    marksPerQuestion: String(test.marksPerQuestion),
    negativeMarking: String(test.negativeMarking),
    startAt: test.startAt,
    endAt: test.endAt,
    subjectIds: [...test.subjectIds],
    topicIds: [...test.topicIds],
    questionIds: [...test.questionIds],
  };
}

const isPositive = (text: string) => Number.isFinite(Number(text)) && Number(text) > 0;

// Checks one step. An empty result means the step is fine.
export function validateStep(step: number, values: TestFormValues): TestFormErrors {
  const errors: TestFormErrors = {};

  if (step === 0) {
    if (!values.title.trim()) errors.title = "Give the test a title.";
    if (!isPositive(values.durationMinutes)) errors.durationMinutes = "Enter the duration in minutes.";
    if (!isPositive(values.marksPerQuestion)) errors.marksPerQuestion = "Enter the marks for each question.";
    if (!values.startAt) errors.startAt = "Choose when the test starts.";
    if (!values.endAt) errors.endAt = "Choose when the test ends.";
    else if (values.startAt && values.endAt <= values.startAt) errors.endAt = "The end must be after the start.";
  }
  if (step === 1) {
    if (values.subjectIds.length === 0) errors.scope = "Choose at least one subject.";
    else if (values.topicIds.length === 0) errors.scope = "Choose at least one topic.";
  }
  if (step === 2 && values.questionIds.length === 0) {
    errors.questions = "Select at least one question.";
  }

  return errors;
}
