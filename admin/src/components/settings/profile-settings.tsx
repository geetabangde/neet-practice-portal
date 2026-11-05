"use client";

import { useState, type FormEvent } from "react";
import { roleLabel } from "@/components/layout/header";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TextAreaField, TextField } from "@/components/ui/form-controls";

interface ProfileErrors {
  name?: string;
  email?: string;
  phone?: string;
}

export function ProfileSettings() {
  const toast = useToast();
  const { admin } = useAuth();
  const [name, setName] = useState(admin.name);
  const [email, setEmail] = useState(admin.email);
  const [phone, setPhone] = useState("+91 98765 43210");
  const [bio, setBio] = useState("Manages content and students for the NEET PG platform.");
  const [errors, setErrors] = useState<ProfileErrors>({});

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: ProfileErrors = {};
    if (!name.trim()) found.name = "Enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) found.email = "Enter a valid email address.";
    if (phone.replace(/\D/g, "").length < 10) found.phone = "Enter a phone number with at least 10 digits.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    toast({ title: "Profile updated", description: "Saved (demo data: it is not stored anywhere)." });
  }

  return (
    <Card>
      <CardHeader title="Admin profile" description="Your name and contact details" />
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar name={name || "A"} size="lg" />
            <div>
              <p className="font-semibold text-slate-900">{name || "Your name"}</p>
              <p className="text-sm text-slate-500">{roleLabel(admin.role)}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Full name" required value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
            <TextField label="Role" value={roleLabel(admin.role)} readOnly disabled hint="Only a super admin can change roles." />
            <TextField label="Email address" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
            <TextField label="Mobile number" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} />
            <TextAreaField label="About" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} wrapperClassName="sm:col-span-2" />
          </div>
          <div className="flex justify-end">
            <Button type="submit">Save profile</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
