// Types for the whole admin panel. They describe the dummy data in src/data.
// When the real backend exists, its API responses should match these shapes.

export type ActiveStatus = "active" | "inactive";

// ---- Students ----------------------------------------------------------------

export type StudentStatus = ActiveStatus;

export interface Student {
  id: string;
  name: string;
  email: string;
  // The mobile number, shown as "+91 9876543210"
  phone: string;
  // The exam the student prepares for: "NEET PG" or "FMGE"
  exam: string;
  // Dates are YYYY-MM-DD
  registeredAt: string;
  // The day of the last login. null = has not logged in since signing up.
  lastActiveAt: string | null;
  // null = no paid plan yet
  planId: string | null;
  planExpiresAt: string | null;
  status: StudentStatus;
}

// ---- Subjects and topics -------------------------------------------------------

export type SubjectIconKey =
  | "bone"
  | "activity"
  | "microscope"
  | "heart"
  | "eye"
  | "syringe"
  | "brain"
  | "flask"
  | "pill"
  | "dna"
  | "baby"
  | "droplets"
  | "ear"
  | "scan"
  | "smile"
  | "stethoscope";

export interface Subject {
  id: string;
  name: string;
  description: string;
  icon: SubjectIconKey;
  status: ActiveStatus;
}

// A module is a part of a subject. Topics live inside modules: subject > module > topic.
export interface Module {
  id: string;
  subjectId: string;
  name: string;
  status: ActiveStatus;
}

export interface Topic {
  id: string;
  // The subject of the module the topic is in
  subjectId: string;
  moduleId: string;
  name: string;
  durationMinutes: number;
  status: ActiveStatus;
}

// ---- Questions ---------------------------------------------------------------------

export type Difficulty = "easy" | "medium" | "hard";
export type QuestionType = "single" | "multiple";
export type QuestionStatus = "published" | "draft";
export type OptionKey = "A" | "B" | "C" | "D";

export interface Question {
  id: string;
  subjectId: string;
  topicId: string;
  text: string;
  difficulty: Difficulty;
  type: QuestionType;
  options: Record<OptionKey, string>;
  // One letter for "single", one or more for "multiple"
  correct: OptionKey[];
  explanation: string;
  reference: string;
  // Name of the chosen image file
  imageName: string;
  // Token of the saved picture (shown at /api/images/<token>), or null when the question has no image
  imageToken: string | null;
  status: QuestionStatus;
  createdAt: string;
}

// ---- Tests and results ----------------------------------------------------------------

export type TestStatus = "draft" | "published" | "completed";
// Where a test shows in the student Test Series
export type TestKind = "grand" | "mini" | "subject";
export type TestPattern = "NEET" | "INICET";
// Marks taken off for a wrong answer, as a share of the marks of a right answer
export type NegativeRatio = "1/3" | "1/4";

export interface MockTest {
  id: string;
  title: string;
  description: string;
  kind: TestKind;
  pattern: TestPattern;
  // How many questions were written in this test. The questions have their own list (they are not QBank questions).
  questionCount: number;
  // How many parts (Part A, Part B ...) the test is cut into. 0: no parts, one timer for the whole test.
  sectionCount: number;
  durationMinutes: number;
  marksPerQuestion: number;
  negativeRatio: NegativeRatio;
  // Marks removed for each wrong answer: worked out by the server from the marks and the ratio
  negativeMarking: number;
  // YYYY-MM-DDTHH:mm
  startAt: string;
  endAt: string;
  status: TestStatus;
}

export interface TestResult {
  id: string;
  studentId: string;
  testId: string;
  correct: number;
  incorrect: number;
  unattempted: number;
  marksObtained: number;
  totalMarks: number;
  // YYYY-MM-DD
  completedAt: string;
  timeTakenMinutes: number;
  rank: number;
}

// ---- Plans and payments ----------------------------------------------------------------

export interface Plan {
  id: string;
  name: string;
  // In rupees
  price: number;
  durationMonths: number;
  features: string[];
  status: ActiveStatus;
}

export type PaymentMethod = "upi" | "card" | "netbanking" | "wallet";
export type PaymentStatus = "success" | "pending" | "failed" | "refunded";

export interface Payment {
  id: string;
  studentId: string;
  planId: string;
  amount: number;
  method: PaymentMethod;
  // YYYY-MM-DD
  paidAt: string;
  status: PaymentStatus;
  gatewayRef: string;
}

// ---- Notifications ----------------------------------------------------------------------

export type NotificationAudience = "all" | "active" | "inactive" | "premium";
export type NotificationStatus = "sent" | "scheduled" | "draft";

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  audience: NotificationAudience;
  // YYYY-MM-DD
  sendAt: string;
  status: NotificationStatus;
}

// ---- Dashboard and analytics -------------------------------------------------------------

export interface ActivityItem {
  id: string;
  type: "student" | "question" | "test" | "payment" | "system";
  text: string;
  // Already written for people, e.g. "2 hours ago"
  time: string;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface StackedPoint {
  label: string;
  values: number[];
}

export type DateRange = "7d" | "30d" | "90d" | "12m";
