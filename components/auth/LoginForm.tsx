"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { OTP_LENGTH } from "@/lib/schemas/fields";
import { getLoginSchema, type LoginFormValues } from "@/lib/schemas/login";
import ControlledField from "./ControlledField";
import { DEMO_NOTE } from "./demo";
import { primaryButtonClass } from "./styles";

export default function LoginForm() {
  // false = asking for the mobile number, true = OTP box is showing
  const [otpStep, setOtpStep] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    // React Hook Form reads the latest resolver on every render, so the rules
    // follow the screen the user is on
    resolver: zodResolver(getLoginSchema(otpStep)),
    defaultValues: { mobile: "", otp: "" },
  });

  // Runs only when the active schema passes. With a backend, the values would
  // be sent from here, and the server must validate them again.
  // Never log the values: they can contain an OTP.
  const onValid: SubmitHandler<LoginFormValues> = () => {
    if (!otpStep) {
      setOtpStep(true);
      setNotice(`No OTP was sent. ${DEMO_NOTE} Enter any ${OTP_LENGTH} digits to continue.`);
      return;
    }
    setNotice(`Signed-in screen is not built yet. ${DEMO_NOTE}`);
  };

  return (
    <>
      <form
        noValidate
        onSubmit={handleSubmit(onValid, () => setNotice(null))}
        className="space-y-4"
      >
        <ControlledField
          control={control}
          name="mobile"
          id="login-mobile"
          label="Phone number"
          prefix="+91"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="10-digit mobile number"
        />
        {otpStep ? (
          <ControlledField
            control={control}
            name="otp"
            id="login-otp"
            label="OTP"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder={`${OTP_LENGTH}-digit OTP`}
            maxLength={OTP_LENGTH}
          />
        ) : null}

        <button
          suppressHydrationWarning
          type="submit"
          disabled={isSubmitting}
          className={primaryButtonClass}
        >
          {otpStep ? "Verify OTP" : "Get OTP"}
        </button>
      </form>

      <div role="status" aria-live="polite">
        {notice ? (
          <p className="mt-4 rounded-lg bg-accent-soft p-3 text-xs text-brand-950">{notice}</p>
        ) : null}
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        New user?{" "}
        <Link href="/signup" className="font-semibold text-accent-dark hover:underline">
          Sign up
        </Link>
      </p>
    </>
  );
}
