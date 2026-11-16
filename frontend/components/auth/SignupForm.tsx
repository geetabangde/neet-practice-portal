"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { examOptions } from "@/data/landing";
import { OTP_LENGTH } from "@/lib/schemas/fields";
import { getSignupSchema, type SignupFormValues } from "@/lib/schemas/signup";
import { requestSignupOtp, saveToken, verifySignup } from "@/lib/studentAuth";
import ControlledField from "./ControlledField";
import NoticeBox from "./NoticeBox";
import { outlineButtonClass, primaryButtonClass } from "./styles";
import { useOtpNotice } from "./useOtpNotice";

export default function SignupForm() {
  const router = useRouter();
  // false = details screen, true = OTP screen
  const [otpStep, setOtpStep] = useState(false);
  const [resending, setResending] = useState(false);
  const { notice, seconds, otpSent, failed, clear } = useOtpNotice();

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { isSubmitting },
  } = useForm<SignupFormValues>({
    // The resolver follows the screen: details first, then details + OTP
    resolver: zodResolver(getSignupSchema(otpStep)),
    defaultValues: { name: "", mobile: "", email: "", exam: "NEET PG", terms: false, otp: "" },
  });

  function backToDetails() {
    setOtpStep(false);
    clear();
    // Clear errors and the submitted state, keep what the user typed (except the OTP)
    reset({ ...getValues(), otp: "" });
  }

  // Runs only when the active schema passes. The server checks everything again.
  // Never log the values: they contain personal details and an OTP.
  const onValid: SubmitHandler<SignupFormValues> = async (values) => {
    clear();
    const details = {
      name: values.name.trim(),
      mobile: values.mobile.trim(),
      email: values.email.trim(),
      exam: values.exam,
    };

    if (!otpStep) {
      const result = await requestSignupOtp(details);
      if (!result.ok) return failed(result);
      setOtpStep(true);
      otpSent(result.message, result.data);
      return;
    }

    const result = await verifySignup(details, values.otp.trim());
    if (!result.ok) return failed(result);
    saveToken(result.data.token);
    router.push("/dashboard");
  };

  async function resendOtp() {
    const values = getValues();
    setResending(true);
    const result = await requestSignupOtp({
      name: values.name.trim(),
      mobile: values.mobile.trim(),
      email: values.email.trim(),
      exam: values.exam,
    });
    setResending(false);
    if (result.ok) otpSent(result.message, result.data);
    else failed(result);
  }

  return (
    <>
      <form
        noValidate
        onSubmit={handleSubmit(onValid, clear)}
        className="space-y-4"
      >
        {otpStep ? (
          <>
            <p className="text-sm text-slate-600">
              Enter the {OTP_LENGTH}-digit OTP for{" "}
              <span className="font-semibold text-brand-950">+91 {getValues("mobile").trim()}</span>.
            </p>
            <ControlledField
              control={control}
              name="otp"
              id="signup-otp"
              label="OTP"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={`${OTP_LENGTH}-digit OTP`}
              maxLength={OTP_LENGTH}
            />
            <button
              suppressHydrationWarning
              type="submit"
              disabled={isSubmitting}
              className={primaryButtonClass}
            >
              {isSubmitting ? "Please wait..." : "Verify OTP"}
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button
                suppressHydrationWarning
                type="button"
                onClick={resendOtp}
                disabled={resending || isSubmitting || seconds > 0}
                className={`${outlineButtonClass} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {seconds > 0 ? `Resend OTP (${seconds}s)` : "Resend OTP"}
              </button>
              <button
                suppressHydrationWarning
                type="button"
                onClick={backToDetails}
                className={outlineButtonClass}
              >
                Change details
              </button>
            </div>
          </>
        ) : (
          <>
            <Controller
              control={control}
              name="exam"
              render={({ field }) => (
                <fieldset>
                  <legend className="text-xs font-medium text-slate-600">I&apos;m preparing for</legend>
                  <div className="mt-1.5 grid grid-cols-2 gap-3">
                    {examOptions.map((option) => (
                      <label
                        key={option}
                        className={`cursor-pointer rounded-lg border py-2.5 text-center text-sm font-medium has-focus-visible:outline-2 has-focus-visible:outline-accent ${
                          field.value === option
                            ? "border-accent bg-accent text-white"
                            : "border-slate-300 bg-white text-brand-950"
                        }`}
                      >
                        <input
                          suppressHydrationWarning
                          type="radio"
                          name={field.name}
                          value={option}
                          checked={field.value === option}
                          onChange={() => field.onChange(option)}
                          className="sr-only"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
            />

            <ControlledField
              control={control}
              name="name"
              id="signup-name"
              label="Full name"
              autoComplete="name"
              placeholder="Full name"
            />
            <ControlledField
              control={control}
              name="mobile"
              id="signup-mobile"
              label="Mobile number"
              prefix="+91"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="10-digit mobile number"
            />
            <ControlledField
              control={control}
              name="email"
              id="signup-email"
              label="Email address"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
            />

            <Controller
              control={control}
              name="terms"
              render={({ field, fieldState }) => (
                <div>
                  <label className="flex items-start gap-2 text-xs text-slate-600">
                    <input
                      suppressHydrationWarning
                      type="checkbox"
                      name={field.name}
                      ref={field.ref}
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      onBlur={field.onBlur}
                      aria-invalid={fieldState.error ? true : undefined}
                      aria-describedby={fieldState.error ? "signup-terms-error" : undefined}
                      className="mt-0.5 h-4 w-4 accent-accent"
                    />
                    I agree to be contacted by call, SMS, email or WhatsApp and accept the Terms of Use.
                  </label>
                  {fieldState.error ? (
                    <p id="signup-terms-error" className="mt-1 text-xs text-rose-600">
                      {fieldState.error.message}
                    </p>
                  ) : null}
                </div>
              )}
            />

            <button
              suppressHydrationWarning
              type="submit"
              disabled={isSubmitting}
              className={primaryButtonClass}
            >
              {isSubmitting ? "Please wait..." : "Sign up"}
            </button>
          </>
        )}
      </form>

      <NoticeBox notice={notice} />

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent-dark hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
