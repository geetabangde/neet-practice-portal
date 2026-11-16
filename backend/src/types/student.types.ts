import type { RowDataPacket } from "mysql2";

export const EXAMS = ["NEET PG", "FMGE"] as const;
export type Exam = (typeof EXAMS)[number];
export type StudentStatus = "active" | "inactive";

// One row of the "students" table
export interface StudentRow extends RowDataPacket {
  id: number;
  name: string;
  mobile: string;
  email: string;
  exam: Exam;
  status: StudentStatus;
}

// The only student fields that may leave the server
export interface SafeStudent {
  id: number;
  name: string;
  mobile: string;
  email: string;
  exam: Exam;
}

export type OtpPurpose = "signup" | "login";

// What happened when a student typed an OTP
export type OtpCheck = "ok" | "wrong" | "expired" | "too_many";
