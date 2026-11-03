"use client";

import { ChevronDown } from "lucide-react";
import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

// ---- Raw controls (no label). Use them in toolbars and filters with an aria-label. ----

const controlBase =
  "w-full rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

function controlStyles(invalid: boolean, className?: string) {
  return cn(
    controlBase,
    invalid
      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
      : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-100",
    className,
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  leftIcon?: ReactNode;
}

export function Input({ invalid = false, leftIcon, className, ...props }: InputProps) {
  if (!leftIcon) {
    return <input aria-invalid={invalid || undefined} className={controlStyles(invalid, cn("h-10 px-3", className))} {...props} />;
  }
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400" aria-hidden="true">
        {leftIcon}
      </span>
      <input aria-invalid={invalid || undefined} className={controlStyles(invalid, cn("h-10 pl-10 pr-3", className))} {...props} />
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({ invalid = false, className, rows = 4, ...props }: TextareaProps) {
  return <textarea rows={rows} aria-invalid={invalid || undefined} className={controlStyles(invalid, cn("px-3 py-2.5", className))} {...props} />;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export function Select({ invalid = false, className, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        aria-invalid={invalid || undefined}
        className={controlStyles(invalid, cn("h-10 appearance-none pl-3 pr-9", className))}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
    </div>
  );
}

// ---- Fields: a control with its label, hint and error message ----

interface FieldFrameProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

function FieldFrame({ id, label, hint, error, required, className, children }: FieldFrameProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required ? (
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  wrapperClassName?: string;
}

// aria-describedby points at whichever message is showing (error first, then the hint)
function describedBy(id: string, error?: string, hint?: string) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export function TextField({
  label,
  hint,
  error,
  required,
  wrapperClassName,
  id,
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement> & { leftIcon?: ReactNode }) {
  const fallbackId = useId();
  const fieldId = id ?? fallbackId;
  return (
    <FieldFrame id={fieldId} label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      <Input id={fieldId} invalid={Boolean(error)} aria-describedby={describedBy(fieldId, error, hint)} {...props} />
    </FieldFrame>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  required,
  wrapperClassName,
  id,
  ...props
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const fallbackId = useId();
  const fieldId = id ?? fallbackId;
  return (
    <FieldFrame id={fieldId} label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      <Textarea id={fieldId} invalid={Boolean(error)} aria-describedby={describedBy(fieldId, error, hint)} {...props} />
    </FieldFrame>
  );
}

export function SelectField({
  label,
  hint,
  error,
  required,
  wrapperClassName,
  id,
  children,
  ...props
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const fallbackId = useId();
  const fieldId = id ?? fallbackId;
  return (
    <FieldFrame id={fieldId} label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      <Select id={fieldId} invalid={Boolean(error)} aria-describedby={describedBy(fieldId, error, hint)} {...props}>
        {children}
      </Select>
    </FieldFrame>
  );
}

// ---- Checkbox, radio and switch ----

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  description?: string;
  // "radio" is used for single-answer choices
  kind?: "checkbox" | "radio";
}

export function Checkbox({ label, description, kind = "checkbox", className, ...props }: CheckboxProps) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3", className)}>
      <input
        type={kind}
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0 cursor-pointer border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1",
          kind === "checkbox" ? "rounded" : "rounded-full",
        )}
        {...props}
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-700">{label}</span>
        {description ? <span className="block text-xs text-slate-500">{description}</span> : null}
      </span>
    </label>
  );
}

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

// An on/off toggle. The label is read by screen readers (and shown by the page around it).
export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-indigo-600" : "bg-slate-300",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
