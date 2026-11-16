"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { OTP_LENGTH } from "@/lib/schemas/fields";
import { getLoginSchema, type LoginFormValues } from "@/lib/schemas/login";
import { requestLoginOtp, saveToken, verifyLogin } from "@/lib/studentAuth";
import ControlledField from "./ControlledField";
import NoticeBox from "./NoticeBox";
import { outlineButtonClass, primaryButtonClass } from "./styles";
import { useOtpNotice } from "./useOtpNotice";

export default function LoginForm() {
  const router = useRouter();
  // false = asking for the mobile number, true = OTP box is showing
  const [otpStep, setOtpStep] = useState(false);
  const [resending, setResending] = useState(false);
  const { notice, seconds, otpSent, failed, clear } = useOtpNotice();

  const {
    control,
    handleSubmit,
    getValues,
    reset,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    // React Hook Form reads the latest resolver on every render, so the rules
    // follow the screen the user is on
    resolver: zodResolver(getLoginSchema(otpStep)),
    defaultValues: { mobile: "", otp: "" },
  });

  // Runs only when the active schema passes. The server checks everything again.
  // Never log the values: they can contain an OTP.
  const onValid: SubmitHandler<LoginFormValues> = async (values) => {
    clear();

    if (!otpStep) {
      const result = await requestLoginOtp(values.mobile.trim());
      if (!result.ok) return failed(result);
      setOtpStep(true);
      otpSent(result.message, result.data);
      return;
    }

    const result = await verifyLogin(values.mobile.trim(), values.otp.trim());
    if (!result.ok) return failed(result);
    saveToken(result.data.token);
    router.push("/dashboard");
  };

  async function resendOtp() {
    setResending(true);
    const result = await requestLoginOtp(getValues("mobile").trim());
    setResending(false);
    if (result.ok) otpSent(result.message, result.data);
    else failed(result);
  }

  function changeNumber() {
    setOtpStep(false);
    clear();
    // Keep the number, clear the OTP and any error messages
    reset({ mobile: getValues("mobile"), otp: "" });
  }

  return (
    <>
      <form noValidate onSubmit={handleSubmit(onValid, clear)} className="space-y-4">
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
          {isSubmitting ? "Please wait..." : otpStep ? "Verify OTP" : "Get OTP"}
        </button>

        {otpStep ? (
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
            <button suppressHydrationWarning type="button" onClick={changeNumber} className={outlineButtonClass}>
              Change number
            </button>
          </div>
        ) : null}
      </form>

      <NoticeBox notice={notice} />

      <p className="mt-6 text-center text-sm text-slate-600">
        New user?{" "}
        <Link href="/signup" className="font-semibold text-accent-dark hover:underline">
          Sign up
        </Link>
      </p>
    </>
  );
}
