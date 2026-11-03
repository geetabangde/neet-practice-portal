"use client";

import { ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch, TextField } from "@/components/ui/form-controls";
import { cn } from "@/lib/cn";

interface PasswordErrors {
  current?: string;
  next?: string;
  confirm?: string;
}

// 0 (empty) to 4 (strong)
function strengthOf(password: string): number {
  if (!password) return 0;
  const checks = [password.length >= 8, /[A-Z]/.test(password) && /[a-z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)];
  return checks.filter(Boolean).length;
}

const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColors = ["bg-slate-200", "bg-red-500", "bg-amber-500", "bg-emerald-400", "bg-emerald-600"];

export function SecuritySettings() {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [twoFactor, setTwoFactor] = useState(false);

  const strength = strengthOf(next);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: PasswordErrors = {};
    if (!current) found.current = "Enter your current password.";
    if (next.length < 8) found.next = "The new password must be at least 8 characters.";
    else if (next === current) found.next = "Choose a password different from the current one.";
    if (confirm !== next) found.confirm = "The two passwords do not match.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    toast({ title: "Password updated", description: "Demo only: no password was really changed." });
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Change password" description="Use a strong password you do not use anywhere else" />
        <CardContent>
          <form onSubmit={onSubmit} noValidate className="max-w-md space-y-4">
            <TextField label="Current password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} error={errors.current} />
            <div>
              <TextField label="New password" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} error={errors.next} />
              <div className="mt-2" aria-live="polite">
                <div className="flex gap-1.5" aria-hidden="true">
                  {[1, 2, 3, 4].map((level) => (
                    <span key={level} className={cn("h-1.5 flex-1 rounded-full", strength >= level ? strengthColors[strength] : "bg-slate-200")} />
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  {next ? `Strength: ${strengthLabels[strength]}` : "Use 8+ characters with upper and lower case letters, a number and a symbol."}
                </p>
              </div>
            </div>
            <TextField label="Confirm new password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} />
            <Button type="submit">Update password</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Two-factor authentication</p>
              <p className="mt-0.5 text-sm text-slate-500">Ask for a code from your phone when you sign in.</p>
            </div>
          </div>
          <Switch
            label="Two-factor authentication"
            checked={twoFactor}
            onChange={(checked) => {
              setTwoFactor(checked);
              toast({ title: checked ? "Two-factor turned on" : "Two-factor turned off", description: "Demo only: nothing changes yet.", tone: "info" });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
