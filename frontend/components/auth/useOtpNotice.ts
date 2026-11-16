"use client";

import { useState } from "react";
import { useCountdown } from "@/lib/useCountdown";
import { otpNotice } from "@/lib/studentAuth";

// The message under a login or signup form: a hint (info) or something that went wrong (error)
export type Notice = { tone: "info" | "error"; text: string };

// What the server answered when an OTP was made
type Sent = { resendAfterSeconds: number; demoOtp?: string };

// What a failed request looks like. retryAfterSeconds is there when the server says "wait N seconds".
type Failure = { message: string; retryAfterSeconds?: number };

// Keeps the message under the form and the "you can ask again in N seconds" countdown for it.
// Both login and signup use it, so they behave the same.
export function useOtpNotice() {
  const [notice, setNotice] = useState<(Notice & { live?: boolean }) | null>(null);
  const { seconds, start } = useCountdown();

  // An OTP was made: show it (demo mode) and start the wait before the next one is allowed
  function otpSent(message: string, sent: Sent) {
    start(sent.resendAfterSeconds);
    setNotice({ tone: "info", text: otpNotice(message, sent) });
  }

  // A request failed. When the server asks to wait, the message counts down instead of staying fixed.
  function failed(result: Failure) {
    if (result.retryAfterSeconds !== undefined) start(result.retryAfterSeconds);
    setNotice({ tone: "error", text: result.message, live: result.retryAfterSeconds !== undefined });
  }

  // What is on screen right now. A "wait" message is rebuilt every second from the countdown.
  let shown: Notice | null = notice;
  if (notice?.live) {
    shown =
      seconds > 0
        ? { tone: "error", text: `Please wait ${seconds} second${seconds === 1 ? "" : "s"} before asking for a new OTP.` }
        : { tone: "info", text: "You can ask for a new OTP now." };
  }

  return { notice: shown, seconds, otpSent, failed, clear: () => setNotice(null) };
}
