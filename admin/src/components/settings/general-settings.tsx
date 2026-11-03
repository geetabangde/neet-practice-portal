"use client";

import { useState, type FormEvent } from "react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SelectField, Switch, TextField } from "@/components/ui/form-controls";

export function GeneralSettings() {
  const toast = useToast();
  const [siteName, setSiteName] = useState("HN QBank");
  const [supportEmail, setSupportEmail] = useState("support@example.com");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [language, setLanguage] = useState("en");
  const [maintenance, setMaintenance] = useState(false);
  const [errors, setErrors] = useState<{ siteName?: string; supportEmail?: string }>({});

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: typeof errors = {};
    if (!siteName.trim()) found.siteName = "Enter the platform name.";
    if (!/^\S+@\S+\.\S+$/.test(supportEmail.trim())) found.supportEmail = "Enter a valid email address.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    toast({ title: "Settings saved", description: "Demo only: they are not stored anywhere." });
  }

  return (
    <Card>
      <CardHeader title="General settings" description="Details of the platform shown to students" />
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Platform name" required value={siteName} onChange={(e) => setSiteName(e.target.value)} error={errors.siteName} />
            <TextField label="Support email" type="email" required value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} error={errors.supportEmail} />
            <SelectField label="Time zone" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              <option value="Asia/Kolkata">India Standard Time (IST)</option>
              <option value="Asia/Dubai">Gulf Standard Time (GST)</option>
              <option value="UTC">Coordinated Universal Time (UTC)</option>
            </SelectField>
            <SelectField label="Default language" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </SelectField>
          </div>

          <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Maintenance mode</p>
              <p className="mt-0.5 text-sm text-slate-500">Students see a &ldquo;back soon&rdquo; page while you make changes.</p>
            </div>
            <Switch label="Maintenance mode" checked={maintenance} onChange={setMaintenance} />
          </div>

          <div className="flex justify-end">
            <Button type="submit">Save settings</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
