"use client";

import { useState, type SubmitEvent } from "react";
import { CheckIcon } from "@/components/ui/Icons";
import { examOptions, trialPerks } from "@/data/landing";

type Exam = (typeof examOptions)[number];
type FieldName = "name" | "mobile" | "email";
type FormErrors = Partial<Record<FieldName, string>>;

function validate(values: Record<FieldName, string>): FormErrors {
  const errors: FormErrors = {};
  if (!values.name.trim()) errors.name = "Please enter your full name.";
  if (!/^(\+?91)?\d{10}$/.test(values.mobile.replace(/[\s-]/g, ""))) {
    errors.mobile = "Enter a valid 10-digit mobile number.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  return errors;
}

const inputClass =
  "mt-2 h-11 w-full rounded-lg border bg-white/15 px-3 text-xs text-white placeholder:text-white/50 focus:outline-2 focus:outline-accent";

export default function FreeTrialSection() {
  const [exam, setExam] = useState<Exam>("NEET PG");
  const [values, setValues] = useState<Record<FieldName, string>>({
    name: "",
    mobile: "",
    email: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submittedName, setSubmittedName] = useState<string | null>(null);

  function handleChange(field: FieldName, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    // Nothing is sent anywhere yet: there is no backend in this version
    setSubmittedName(Object.keys(found).length === 0 ? values.name.trim() : null);
  }

  const fields: { name: FieldName; label: string; type: string; placeholder: string; autoComplete: string }[] = [
    { name: "name", label: "Full name", type: "text", placeholder: "Full name", autoComplete: "name" },
    { name: "mobile", label: "Mobile number", type: "tel", placeholder: "+91", autoComplete: "tel-national" },
    { name: "email", label: "Email address", type: "email", placeholder: "Email address", autoComplete: "email" },
  ];

  return (
    <section id="trial" aria-labelledby="trial-heading" className="bg-white px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-start gap-10 rounded-[40px] bg-brand-950 bg-[radial-gradient(ellipse_at_35%_50%,#0b4250_0%,#06303a_30%,#031a20_65%,#021214_100%)] p-6 text-white sm:p-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        <div>
          <h2 id="trial-heading" className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Book Your Instant Free Trial.
          </h2>
          <p className="mt-5 max-w-md text-sm text-white/80">
            Tell us where you are in your prep. We&apos;ll set you up with trial
            access, no payment required.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-white/80">
            {trialPerks.map((perk) => (
              <li key={perk} className="flex items-center gap-2">
                <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-accent/25 text-accent">
                  <CheckIcon className="h-3 w-3" />
                </span>
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <form
          noValidate
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white/10 p-5"
        >
          <fieldset>
            <legend className="text-xs text-white">I&apos;m preparing for</legend>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {examOptions.map((option) => (
                <label
                  key={option}
                  className={`cursor-pointer rounded-lg py-3 text-center text-xs font-medium has-focus-visible:outline-2 has-focus-visible:outline-accent ${
                    exam === option ? "bg-accent text-white" : "bg-white/15 text-white"
                  }`}
                >
                  <input
                    suppressHydrationWarning
                    type="radio"
                    name="exam"
                    value={option}
                    checked={exam === option}
                    onChange={() => setExam(option)}
                    className="sr-only"
                  />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>

          {fields.map((f) => {
            const error = errors[f.name];
            return (
              <div key={f.name} className="mt-4">
                <label htmlFor={`trial-${f.name}`} className="text-xs text-white">
                  {f.label}
                </label>
                <input
                  suppressHydrationWarning
                  id={`trial-${f.name}`}
                  name={f.name}
                  type={f.type}
                  autoComplete={f.autoComplete}
                  placeholder={f.placeholder}
                  value={values[f.name]}
                  onChange={(e) => handleChange(f.name, e.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `trial-${f.name}-error` : undefined}
                  className={`${inputClass} ${error ? "border-rose-400" : "border-white/10"}`}
                />
                {error ? (
                  <p id={`trial-${f.name}-error`} className="mt-1 text-xs text-rose-300">
                    {error}
                  </p>
                ) : null}
              </div>
            );
          })}

          <button
            suppressHydrationWarning
            type="submit"
            className="mt-6 h-11 w-full rounded-full bg-accent text-sm font-semibold text-white transition-colors hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Start Free Trial
          </button>

          <div role="status" aria-live="polite">
            {submittedName ? (
              <p className="mt-3 rounded-lg bg-emerald-500/15 p-3 text-xs text-emerald-200">
                Thanks, {submittedName}. Your details look good for the {exam} trial.
                This is a demo form, so nothing has been saved or sent yet.
              </p>
            ) : null}
          </div>

          <p className="mt-3 text-[10px] text-white/60">
            By submitting, I agree to be contacted by call, SMS, email or
            WhatsApp and accept the Terms of Use.
          </p>
        </form>
      </div>
    </section>
  );
}
