"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { examOptions } from "@/data/landing";
import { OTP_LENGTH } from "@/lib/schemas/fields";
import { getSignupSchema, type SignupFormValues } from "@/lib/schemas/signup";
import ControlledField from "./ControlledField";
import { DEMO_NOTE } from "./demo";
import { outlineButtonClass, primaryButtonClass } from "./styles";

export default function SignupForm() {
  // false = details screen, true = OTP screen
  const [otpStep, setOtpStep] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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
    setNotice(null);
    // Clear errors and the submitted state, keep what the user typed (except the OTP)
    reset({ ...getValues(), otp: "" });
  }

  // Runs only when the active schema passes. With a backend, the values would
  // be sent from here, and the server must validate them again.
  // Never log the values: they contain personal details and an OTP.
  const onValid: SubmitHandler<SignupFormValues> = (values) => {
    if (!otpStep) {
      setOtpStep(true);
      setNotice(`No OTP was sent. ${DEMO_NOTE} Enter any ${OTP_LENGTH} digits to continue.`);
      return;
    }
    setNotice(`Thanks, ${values.name}. No account was created. ${DEMO_NOTE}`);
  };

  return (
    <>
      <form
        noValidate
        onSubmit={handleSubmit(onValid, () => setNotice(null))}
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
              Verify OTP
            </button>
            <button
              suppressHydrationWarning
              type="button"
              onClick={backToDetails}
              className={outlineButtonClass}
            >
              Change details
            </button>
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
              Sign up
            </button>
          </>
        )}
      </form>

      <div role="status" aria-live="polite">
        {notice ? (
          <p className="mt-4 rounded-lg bg-accent-soft p-3 text-xs text-brand-950">{notice}</p>
        ) : null}
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent-dark hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
