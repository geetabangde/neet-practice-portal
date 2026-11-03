"use client";

import { useState, type FormEvent } from "react";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import type { Student, StudentStatus } from "@/types";

const FORM_ID = "student-form";

interface StudentErrors {
  name?: string;
  email?: string;
  phone?: string;
}

function validate(values: { name: string; email: string; phone: string }): StudentErrors {
  const errors: StudentErrors = {};
  if (!values.name.trim()) errors.name = "Enter the student's name.";
  if (!values.email.trim()) errors.email = "Enter an email address.";
  else if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = "Enter a valid email address.";
  if (values.phone.replace(/\D/g, "").length < 10) errors.phone = "Enter a phone number with at least 10 digits.";
  return errors;
}

function StudentForm({ student, onSaved }: { student: Student; onSaved: () => void }) {
  const { students, plans } = useAdminStore();
  const toast = useToast();

  const [name, setName] = useState(student.name);
  const [email, setEmail] = useState(student.email);
  const [phone, setPhone] = useState(student.phone);
  const [city, setCity] = useState(student.city);
  const [college, setCollege] = useState(student.college);
  const [planId, setPlanId] = useState(student.planId ?? "");
  const [status, setStatus] = useState<StudentStatus>(student.status);
  const [errors, setErrors] = useState<StudentErrors>({});

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate({ name, email, phone });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    students.update(student.id, {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      city: city.trim(),
      college: college.trim(),
      planId: planId || null,
      // Taking the plan away also clears its expiry date
      planExpiresAt: planId ? student.planExpiresAt : null,
      status,
    });
    toast({ title: "Student updated", description: `${name.trim()} was saved (demo data).` });
    onSaved();
  }

  return (
    <form id={FORM_ID} onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <TextField label="Full name" required value={name} onChange={(e) => setName(e.target.value)} error={errors.name} wrapperClassName="sm:col-span-2" />
      <TextField label="Email address" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
      <TextField label="Mobile number" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} />
      <TextField label="City" value={city} onChange={(e) => setCity(e.target.value)} />
      <TextField label="College" value={college} onChange={(e) => setCollege(e.target.value)} />
      <SelectField label="Subscription plan" value={planId} onChange={(e) => setPlanId(e.target.value)}>
        <option value="">No plan</option>
        {plans.items.map((plan) => (
          <option key={plan.id} value={plan.id}>
            {plan.name}
          </option>
        ))}
      </SelectField>
      <SelectField label="Account status" value={status} onChange={(e) => setStatus(e.target.value as StudentStatus)}>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </SelectField>
    </form>
  );
}

interface StudentFormModalProps {
  // null = the pop-up is closed
  student: Student | null;
  onClose: () => void;
}

export function StudentFormModal({ student, onClose }: StudentFormModalProps) {
  return (
    <Modal
      open={student !== null}
      onClose={onClose}
      title="Edit student"
      description="Update the student's profile, plan and account status."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID}>
            Save changes
          </Button>
        </>
      }
    >
      {student ? <StudentForm key={student.id} student={student} onSaved={onClose} /> : null}
    </Modal>
  );
}
