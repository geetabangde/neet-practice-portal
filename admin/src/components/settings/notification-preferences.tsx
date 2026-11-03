"use client";

import { useState } from "react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/form-controls";

type Channel = "email" | "push";

interface Preference {
  id: string;
  title: string;
  description: string;
  email: boolean;
  push: boolean;
}

const initial: Preference[] = [
  { id: "registration", title: "New student registration", description: "When a student creates an account.", email: true, push: true },
  { id: "payment", title: "Payment received", description: "When a student buys a plan.", email: true, push: false },
  { id: "failed", title: "Payment failed or refunded", description: "When a payment does not go through.", email: true, push: true },
  { id: "drafts", title: "Draft questions waiting", description: "A reminder about unpublished questions.", email: false, push: true },
  { id: "weekly", title: "Weekly summary report", description: "Students, tests and revenue every Monday.", email: true, push: false },
];

export function NotificationPreferences() {
  const toast = useToast();
  const [preferences, setPreferences] = useState(initial);

  function toggle(id: string, channel: Channel, value: boolean) {
    setPreferences((prev) => prev.map((p) => (p.id === id ? { ...p, [channel]: value } : p)));
  }

  return (
    <Card>
      <CardHeader title="Notification preferences" description="Choose how you want to hear about what happens on the platform" />
      <CardContent>
        <div className="hidden grid-cols-[1fr_72px_72px] gap-4 border-b border-slate-100 pb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
          <span>Event</span>
          <span className="text-center">Email</span>
          <span className="text-center">Push</span>
        </div>
        <ul className="divide-y divide-slate-100">
          {preferences.map((preference) => (
            <li key={preference.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-2 py-4 sm:grid-cols-[1fr_72px_72px]">
              <div className="col-span-3 sm:col-span-1">
                <p className="text-sm font-medium text-slate-900">{preference.title}</p>
                <p className="text-sm text-slate-500">{preference.description}</p>
              </div>
              <label className="flex items-center justify-center gap-2 text-xs text-slate-500 sm:text-transparent">
                <Switch label={`${preference.title}: email`} checked={preference.email} onChange={(value) => toggle(preference.id, "email", value)} />
                <span className="sm:hidden">Email</span>
              </label>
              <label className="flex items-center justify-center gap-2 text-xs text-slate-500 sm:text-transparent">
                <Switch label={`${preference.title}: push`} checked={preference.push} onChange={(value) => toggle(preference.id, "push", value)} />
                <span className="sm:hidden">Push</span>
              </label>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => toast({ title: "Preferences saved", description: "Demo only: they are not stored anywhere." })}>
            Save preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
