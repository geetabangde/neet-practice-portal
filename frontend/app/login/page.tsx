import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Log in | HN QBank",
  description: "Log in to HN QBank with your phone number or email.",
};

export default function LoginPage() {
  return (
    <AuthShell title="Log in to HN QBank" subtitle="Enter your registered phone number">
      <LoginForm />
    </AuthShell>
  );
}
