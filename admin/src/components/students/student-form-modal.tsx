"use client";

import { useState, type FormEvent } from "react";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import { updateStudent } from "@/lib/students-api";
import type { Student, StudentStatus } from "@/types";

const FORM_ID = "student-form";

interface StudentErrors {
  name?: string;
  email?: string;
  phone?: string;
  form?: string;
}

function validate(values: { name: string; email: string; phone: string }): StudentErrors {
  const errors: StudentErrors = {};
  if (!values.name.trim()) errors.name = "Enter the student's name.";
  if (!values.email.trim()) errors.email = "Enter an email address.";
  else if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = "Enter a valid email address.";
  if (!/^(\+?91)?\d{10}$/.test(values.phone.replace(/[\s-]/g, ""))) errors.phone = "Enter a valid 10-digit mobile number.";
  return errors;
}

function StudentForm({ student, onSaved, onSavingChange }: { student: Student; onSaved: () => void; onSavingChange: (saving: boolean) => void }) {
  const { students, plans } = useAdminStore();
  const toast = useToast();

  const [name, setName] = useState(student.name);
  const [email, setEmail] = useState(student.email);
  // The list shows "+91 9876543210"; the form shows only the 10 digits
  const [phone, setPhone] = useState(student.phone.replace(/^\+91\s*/, ""));
  const [exam, setExam] = useState(student.exam);
  const [planId, setPlanId] = useState(student.planId ?? "");
  const [planExpiresAt, setPlanExpiresAt] = useState(student.planExpiresAt ?? "");
  const [status, setStatus] = useState<StudentStatus>(student.status);
  const [errors, setErrors] = useState<StudentErrors>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate({ name, email, phone });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onSavingChange(true);
    const result = await updateStudent(student.id, {
      name: name.trim(),
      email: email.trim(),
      mobile: phone.trim(),
      exam,
      status,
      planId: planId || null,
      // Taking the plan away also clears its expiry date
      planExpiresAt: planId ? planExpiresAt || null : null,
    });
    onSavingChange(false);

    if (!result.ok) {
      // 409 = the mobile number or the email belongs to another student
      if (result.status === 409) {
        setErrors(/email/i.test(result.message) ? { email: result.message } : { phone: result.message });
      } else {
        setErrors({ form: result.message });
      }
      return;
    }
    students.update(student.id, result.data);
    toast({ title: "Student updated", description: `${result.data.name} was saved.` });
    onSaved();
  }

  return (
    <form id={FORM_ID} onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <TextField label="Full name" required value={name} onChange={(e) => setName(e.target.value)} error={errors.name} wrapperClassName="sm:col-span-2" />
      <TextField label="Email address" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
      <TextField label="Mobile number" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} hint="10 digits, without +91" />
      <SelectField label="Preparing for" value={exam} onChange={(e) => setExam(e.target.value)}>
        <option value="NEET PG">NEET PG</option>
        <option value="FMGE">FMGE</option>
      </SelectField>
      <SelectField label="Account status" value={status} onChange={(e) => setStatus(e.target.value as StudentStatus)} hint="An inactive student cannot log in.">
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </SelectField>
      <SelectField label="Subscription plan" value={planId} onChange={(e) => setPlanId(e.target.value)}>
        <option value="">No plan</option>
        {plans.items.map((plan) => (
          <option key={plan.id} value={plan.id}>
            {plan.name}
          </option>
        ))}
      </SelectField>
      <TextField
        label="Plan valid until"
        type="date"
        value={planId ? planExpiresAt : ""}
        disabled={!planId}
        onChange={(e) => setPlanExpiresAt(e.target.value)}
        hint={planId ? "The last day the plan works. Leave empty if it has no end date." : "Choose a plan first."}
      />

      {errors.form ? (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">
          {errors.form}
        </p>
      ) : null}
    </form>
  );
}

interface StudentFormModalProps {
  // null = the pop-up is closed
  student: Student | null;
  onClose: () => void;
}

export function StudentFormModal({ student, onClose }: StudentFormModalProps) {
  const [saving, setSaving] = useState(false);

  return (
    <Modal
      open={student !== null}
      onClose={onClose}
      title="Edit student"
      description="Update the student's details, plan and account status."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={saving}>
            Save changes
          </Button>
        </>
      }
    >
      {student ? <StudentForm key={student.id} student={student} onSaved={onClose} onSavingChange={setSaving} /> : null}
    </Modal>
  );
}
