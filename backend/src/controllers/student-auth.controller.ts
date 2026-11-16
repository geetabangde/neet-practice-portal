import type { Request, Response } from "express";
import { SmsNotConfiguredError, sendOtpSms } from "../services/sms.service";
import {
  OTP_LENGTH,
  OTP_RESEND_SECONDS,
  checkOtp,
  createStudent,
  findStudentByEmail,
  findStudentByMobile,
  isDuplicateStudent,
  issueOtp,
  markLoggedIn,
  normalizeMobile,
  signStudentToken,
  toSafeStudent,
} from "../services/student.service";
import { EXAMS, type Exam, type OtpCheck, type OtpPurpose, type StudentRow } from "../types/student.types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FAILED = { success: false, message: "Something went wrong" };

// What the form sends for signup
interface SignupDetails {
  name: string;
  mobile: string;
  email: string;
  exam: Exam;
}

type Checked<T> = { ok: true; value: T } | { ok: false; message: string };

function bodyOf(req: Request): Record<string, unknown> {
  return typeof req.body === "object" && req.body !== null ? (req.body as Record<string, unknown>) : {};
}

function readMobile(data: Record<string, unknown>): Checked<string> {
  const mobile = typeof data.mobile === "string" ? normalizeMobile(data.mobile) : null;
  return mobile ? { ok: true, value: mobile } : { ok: false, message: "Enter a valid 10-digit mobile number." };
}

function readOtp(data: Record<string, unknown>): Checked<string> {
  const otp = typeof data.otp === "string" ? data.otp.trim() : "";
  return new RegExp(`^\\d{${OTP_LENGTH}}$`).test(otp) ? { ok: true, value: otp } : { ok: false, message: `Enter the ${OTP_LENGTH}-digit OTP.` };
}

// The signup form's fields, checked with the same rules as the form on the website
function readSignup(data: Record<string, unknown>): Checked<SignupDetails> {
  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!name) return { ok: false, message: "Please enter your full name." };
  if (name.length > 100) return { ok: false, message: "The name must be 100 characters or fewer." };

  const mobile = readMobile(data);
  if (!mobile.ok) return mobile;

  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  if (!email || email.length > 190 || !EMAIL_PATTERN.test(email)) return { ok: false, message: "Enter a valid email address." };

  if (typeof data.exam !== "string" || !(EXAMS as readonly string[]).includes(data.exam)) {
    return { ok: false, message: "Choose the exam you are preparing for." };
  }
  if (data.terms !== true) return { ok: false, message: "Please accept the Terms of Use to continue." };

  return { ok: true, value: { name, mobile: mobile.value, email, exam: data.exam as Exam } };
}

// Creates and "sends" the OTP, then answers the request. In demo mode the OTP is part of the answer.
async function sendOtp(res: Response, mobile: string, purpose: OtpPurpose): Promise<void> {
  const issued = await issueOtp(mobile, purpose);
  if (!issued.ok) {
    const message =
      issued.reason === "wait"
        ? `Please wait ${issued.waitSeconds} seconds before asking for a new OTP.`
        : "Too many OTP requests for this number. Please try again after an hour.";
    // Only the short wait gets a countdown on the website; the one-hour limit is just a message
    res.status(429).json({ success: false, message, ...(issued.reason === "wait" ? { data: { retryAfterSeconds: issued.waitSeconds } } : {}) });
    return;
  }

  try {
    const demoOtp = await sendOtpSms(mobile, issued.code);
    res.json({
      success: true,
      message: demoOtp ? "Demo mode: no SMS is sent. Use the OTP shown on screen." : "OTP sent to your mobile number.",
      data: { resendAfterSeconds: OTP_RESEND_SECONDS, ...(demoOtp ? { demoOtp } : {}) },
    });
  } catch (error) {
    if (error instanceof SmsNotConfiguredError) {
      res.status(503).json({ success: false, message: "OTP service is not set up yet. Please try again later." });
      return;
    }
    throw error;
  }
}

// Turns the result of an OTP check into an error answer. Returns true when the OTP was fine.
function rejectBadOtp(res: Response, result: OtpCheck): boolean {
  if (result === "ok") return true;
  if (result === "wrong") {
    res.status(400).json({ success: false, message: "Wrong OTP. Please try again." });
  } else if (result === "too_many") {
    res.status(429).json({ success: false, message: "Too many wrong attempts. Please ask for a new OTP." });
  } else {
    res.status(400).json({ success: false, message: "This OTP has expired. Please ask for a new one." });
  }
  return false;
}

function signedIn(res: Response, student: StudentRow, message: string, status = 200): void {
  res.status(status).json({ success: true, message, data: { student: toSafeStudent(student), token: signStudentToken(student) } });
}

// POST /api/auth/student/signup/request-otp
export async function signupRequestOtp(req: Request, res: Response): Promise<void> {
  const details = readSignup(bodyOf(req));
  if (!details.ok) {
    res.status(400).json({ success: false, message: details.message });
    return;
  }
  try {
    // Telling the visitor the number or email is taken lets them go and log in instead
    if (await findStudentByMobile(details.value.mobile)) {
      res.status(409).json({ success: false, message: "This mobile number is already registered. Please log in." });
      return;
    }
    if (await findStudentByEmail(details.value.email)) {
      res.status(409).json({ success: false, message: "This email address is already registered. Please log in." });
      return;
    }
    await sendOtp(res, details.value.mobile, "signup");
  } catch (error) {
    console.error("Student signup OTP request failed:", error);
    res.status(500).json(FAILED);
  }
}

// POST /api/auth/student/signup/verify
export async function signupVerify(req: Request, res: Response): Promise<void> {
  const data = bodyOf(req);
  const details = readSignup(data);
  const otp = readOtp(data);
  if (!details.ok || !otp.ok) {
    res.status(400).json({ success: false, message: !details.ok ? details.message : (otp as { message: string }).message });
    return;
  }
  try {
    if (!rejectBadOtp(res, await checkOtp(details.value.mobile, "signup", otp.value))) return;

    const student = await createStudent(details.value);
    await markLoggedIn(student.id);
    signedIn(res, student, "Account created", 201);
  } catch (error) {
    if (isDuplicateStudent(error)) {
      res.status(409).json({ success: false, message: "This mobile number or email is already registered. Please log in." });
      return;
    }
    console.error("Student signup failed:", error);
    res.status(500).json(FAILED);
  }
}

// POST /api/auth/student/login/request-otp
export async function loginRequestOtp(req: Request, res: Response): Promise<void> {
  const mobile = readMobile(bodyOf(req));
  if (!mobile.ok) {
    res.status(400).json({ success: false, message: mobile.message });
    return;
  }
  try {
    const student = await findStudentByMobile(mobile.value);
    if (!student) {
      res.status(404).json({ success: false, message: "No account found for this number. Please sign up first." });
      return;
    }
    if (student.status !== "active") {
      res.status(403).json({ success: false, message: "This account is not active. Please contact support." });
      return;
    }
    await sendOtp(res, mobile.value, "login");
  } catch (error) {
    console.error("Student login OTP request failed:", error);
    res.status(500).json(FAILED);
  }
}

// POST /api/auth/student/login/verify
export async function loginVerify(req: Request, res: Response): Promise<void> {
  const data = bodyOf(req);
  const mobile = readMobile(data);
  const otp = readOtp(data);
  if (!mobile.ok || !otp.ok) {
    res.status(400).json({ success: false, message: !mobile.ok ? mobile.message : (otp as { message: string }).message });
    return;
  }
  try {
    if (!rejectBadOtp(res, await checkOtp(mobile.value, "login", otp.value))) return;

    const student = await findStudentByMobile(mobile.value);
    if (!student || student.status !== "active") {
      res.status(403).json({ success: false, message: "This account is not active. Please contact support." });
      return;
    }
    await markLoggedIn(student.id);
    signedIn(res, student, "Login successful");
  } catch (error) {
    console.error("Student login failed:", error);
    res.status(500).json(FAILED);
  }
}

// GET /api/student/me (behind requireStudent)
export function getStudentProfile(_req: Request, res: Response): void {
  res.json({ success: true, message: "Student profile", data: { student: res.locals.student } });
}
