import { z } from "zod";
import { isValidEmail, isValidMobile } from "@/lib/validation";

// Single-field rules shared by the login and signup schemas.
// The first failing check wins, so an empty field shows "Enter ..." and not
// the format message.

export const OTP_LENGTH = 6;

export const mobileField = z
  .string()
  .trim()
  .min(1, "Enter your mobile number.")
  .refine(isValidMobile, "Enter a valid 10-digit mobile number.");

export const emailField = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .refine(isValidEmail, "Enter a valid email address.");

export const otpField = z
  .string()
  .trim()
  .min(1, "Enter the OTP.")
  .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `Enter the ${OTP_LENGTH}-digit OTP.`);
