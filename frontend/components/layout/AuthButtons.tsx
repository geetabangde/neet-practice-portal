"use client";

import Link from "next/link";
import { useSignedIn } from "@/lib/useSignedIn";

// The header buttons: Login and Enroll Now for visitors, Dashboard for a logged-in student
export default function AuthButtons() {
  const signedIn = useSignedIn();

  if (signedIn) {
    return (
      <Link
        href="/dashboard"
        className="hidden rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-brand-950 hover:bg-white/90 sm:inline-block"
      >
        Go to Dashboard
      </Link>
    );
  }

  return (
    <>
      <Link
        href="/login"
        className="hidden rounded-full border border-white/40 px-4 py-1.5 text-sm font-medium hover:bg-white/10 sm:inline-block"
      >
        Login
      </Link>
      <Link
        href="/signup"
        className="hidden rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-brand-950 hover:bg-white/90 md:inline-block"
      >
        Enroll Now
      </Link>
    </>
  );
}
