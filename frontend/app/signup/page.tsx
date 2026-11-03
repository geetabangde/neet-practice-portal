import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import SignupForm from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Sign up | HN QBank",
  description: "Create your HN QBank account for NEET PG and FMGE preparation.",
};

export default function SignupPage() {
  return (
    <AuthShell title="Create your account" subtitle="Start practicing for NEET PG and FMGE">
      <SignupForm />
    </AuthShell>
  );
}
