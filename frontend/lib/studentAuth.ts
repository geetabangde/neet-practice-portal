// Student signup, login and the saved login (token) in this browser.

import { apiGet, apiPost, type ApiResult } from "@/lib/api";

export interface Student {
  id: number;
  name: string;
  mobile: string;
  email: string;
  exam: string;
}

export interface SignupDetails {
  name: string;
  mobile: string;
  email: string;
  exam: string;
}

// What the server says after it has made an OTP. demoOtp exists only while the backend is in OTP_MODE=demo.
interface OtpSent {
  resendAfterSeconds: number;
  demoOtp?: string;
}

interface Session {
  student: Student;
  token: string;
}

const TOKEN_KEY = "hn_student_token";

// Browser storage can throw (private window, blocked site data), so every access is wrapped
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Without storage the student simply has to log in again next time
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // nothing to clear
  }
}

// The sentence shown under the form after an OTP was made
export function otpNotice(message: string, sent: OtpSent): string {
  return sent.demoOtp ? `Demo mode: no SMS is sent. Your OTP is ${sent.demoOtp}.` : message;
}

export function requestSignupOtp(details: SignupDetails): Promise<ApiResult<OtpSent>> {
  // terms is true here: the form only gets this far after the checkbox was ticked
  return apiPost<OtpSent>("/api/auth/student/signup/request-otp", { ...details, terms: true });
}

export function verifySignup(details: SignupDetails, otp: string): Promise<ApiResult<Session>> {
  return apiPost<Session>("/api/auth/student/signup/verify", { ...details, terms: true, otp });
}

export function requestLoginOtp(mobile: string): Promise<ApiResult<OtpSent>> {
  return apiPost<OtpSent>("/api/auth/student/login/request-otp", { mobile });
}

export function verifyLogin(mobile: string, otp: string): Promise<ApiResult<Session>> {
  return apiPost<Session>("/api/auth/student/login/verify", { mobile, otp });
}

// Asks the server who this token belongs to
export function fetchMe(token: string): Promise<ApiResult<{ student: Student }>> {
  return apiGet<{ student: Student }>("/api/student/me", token);
}
