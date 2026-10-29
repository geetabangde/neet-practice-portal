import { z } from "zod";
import { examOptions } from "@/data/landing";
import { emailField, mobileField, otpField } from "./fields";

const nameField = z.string().trim().min(1, "Please enter your full name.");

// A checkbox is a boolean, so "required" means "must be true"
const termsField = z.boolean().refine((accepted) => accepted, "Please accept the Terms of Use to continue.");

// All fields always exist in the form. Each schema below adds real rules only
// for the fields that are on screen.
const signupFields = z.object({
  name: z.string(),
  mobile: z.string(),
  email: z.string(),
  exam: z.enum(examOptions),
  terms: z.boolean(),
  otp: z.string(),
});

export type SignupFormValues = z.infer<typeof signupFields>;

// Screen 1: name, mobile, email and the terms checkbox
export const signupDetailsSchema = signupFields.extend({
  name: nameField,
  mobile: mobileField,
  email: emailField,
  terms: termsField,
});

// Screen 2: the OTP screen, so the OTP is checked as well
export const signupVerifySchema = signupDetailsSchema.extend({
  otp: otpField,
});

export function getSignupSchema(otpSent: boolean) {
  return otpSent ? signupVerifySchema : signupDetailsSchema;
}
