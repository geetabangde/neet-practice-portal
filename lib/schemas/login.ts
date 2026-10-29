import { z } from "zod";
import { mobileField, otpField } from "./fields";

// Both fields always exist in the form (plain strings). Each schema below adds
// real rules only for the fields that are on screen.
const loginFields = z.object({
  mobile: z.string(),
  otp: z.string(),
});

// The form's TypeScript type comes from the schema, so they cannot drift apart
export type LoginFormValues = z.infer<typeof loginFields>;

// Screen 1: only the mobile number is checked
export const loginRequestSchema = loginFields.extend({
  mobile: mobileField,
});

// Screen 2: the OTP box is showing, so the OTP is checked too
export const loginVerifySchema = loginRequestSchema.extend({
  otp: otpField,
});

export function getLoginSchema(otpSent: boolean) {
  return otpSent ? loginVerifySchema : loginRequestSchema;
}
