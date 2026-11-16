// Sends the OTP to the student's phone.
//
// There is no SMS provider yet (a paid service plus India DLT registration is needed). Until one is
// connected, OTP_MODE decides what happens:
//   OTP_MODE=demo  no SMS is sent; the OTP is handed back so the website can show it on screen.
//                  Anyone can then log in as any phone number, so use it only for testing.
//   anything else  the real mode. It needs an SMS provider, so for now sending fails with a clear message.
//
// To connect a provider later, put its call inside sendOtpSms. Nothing else has to change.

export function isDemoOtpMode(): boolean {
  return process.env.OTP_MODE === "demo";
}

export class SmsNotConfiguredError extends Error {
  constructor() {
    super("No SMS provider is connected");
  }
}

// Returns the OTP when it should be shown on screen (demo mode), otherwise null
export async function sendOtpSms(_mobile: string, otp: string): Promise<string | null> {
  if (isDemoOtpMode()) return otp;
  // Real SMS sending goes here, for example a call to MSG91 or Twilio with the OTP text
  throw new SmsNotConfiguredError();
}

// Printed once at startup so nobody forgets that demo mode is on
export function logOtpMode(): void {
  if (isDemoOtpMode()) {
    console.warn("OTP_MODE=demo: OTPs are shown on screen and no SMS is sent. Do not use this for real students.");
  }
}
