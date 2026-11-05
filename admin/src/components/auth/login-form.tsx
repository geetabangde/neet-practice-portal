"use client";

import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox, TextField } from "@/components/ui/form-controls";
import { loginAdmin, saveToken } from "@/lib/auth";

interface LoginErrors {
  email?: string;
  password?: string;
}

function validate(email: string, password: string): LoginErrors {
  const errors: LoginErrors = {};
  if (!email.trim()) errors.email = "Enter your email address.";
  else if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Enter your password.";
  return errors;
}

// Signs in through the backend (POST /api/auth/admin/login) and keeps the token it returns.
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate(email, password);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setServerError("");
    setLoading(true);
    const result = await loginAdmin(email.trim(), password);
    if (!result.ok) {
      setServerError(result.message);
      setLoading(false);
      return;
    }
    saveToken(result.token, remember);
    router.replace("/dashboard");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <TextField
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        leftIcon={<Mail className="h-4 w-4" />}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={errors.email}
      />

      <div>
        <div className="relative">
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            leftIcon={<Lock className="h-4 w-4" />}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute right-2 top-8 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {serverError ? (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </p>
      ) : null}

      <Checkbox label="Remember me" checked={remember} onChange={(event) => setRemember(event.target.checked)} />

      <Button type="submit" size="lg" loading={loading} className="w-full">
        {loading ? "Signing in…" : "Sign in"}
      </Button>

    </form>
  );
}
