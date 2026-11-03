"use client";

import { useState, type FormEvent } from "react";
import { subjectIconKeys, subjectIcons } from "@/components/common/subject-icon";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { nextId } from "@/lib/ids";
import type { ActiveStatus, Subject, SubjectIconKey } from "@/types";

const FORM_ID = "subject-form";

// What the pop-up is doing: "new" = adding, a Subject = editing it, null = closed
export type SubjectModalState = Subject | "new" | null;

function SubjectForm({ subject, onSaved }: { subject: Subject | null; onSaved: () => void }) {
  const { subjects } = useAdminStore();
  const toast = useToast();

  const [name, setName] = useState(subject?.name ?? "");
  const [description, setDescription] = useState(subject?.description ?? "");
  const [icon, setIcon] = useState<SubjectIconKey>(subject?.icon ?? "stethoscope");
  const [status, setStatus] = useState<ActiveStatus>(subject?.status ?? "active");
  const [nameError, setNameError] = useState<string>();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) return setNameError("Enter the subject name.");
    const taken = subjects.items.some((s) => s.id !== subject?.id && s.name.toLowerCase() === trimmed.toLowerCase());
    if (taken) return setNameError("A subject with this name already exists.");

    if (subject) {
      subjects.update(subject.id, { name: trimmed, description: description.trim(), icon, status });
      toast({ title: "Subject updated", description: `${trimmed} was saved (demo data).` });
    } else {
      subjects.add({
        id: nextId("s", subjects.items.map((s) => s.id)),
        name: trimmed,
        description: description.trim(),
        icon,
        status,
      });
      toast({ title: "Subject added", description: `${trimmed} was added (demo data).` });
    }
    onSaved();
  }

  return (
    <form id={FORM_ID} onSubmit={onSubmit} noValidate className="space-y-4">
      <TextField
        label="Subject name"
        required
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setNameError(undefined);
        }}
        error={nameError}
        placeholder="e.g. Forensic Medicine"
      />
      <TextAreaField
        label="Description"
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="One or two lines about what the subject covers"
      />

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-slate-700">Icon</legend>
        <div role="radiogroup" aria-label="Subject icon" className="grid grid-cols-8 gap-2">
          {subjectIconKeys.map((key) => {
            const Icon = subjectIcons[key];
            const selected = key === icon;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={key}
                title={key}
                onClick={() => setIcon(key)}
                className={cn(
                  "flex h-10 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                  selected
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </fieldset>

      <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value as ActiveStatus)}>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </SelectField>
    </form>
  );
}

export function SubjectFormModal({ state, onClose }: { state: SubjectModalState; onClose: () => void }) {
  const editing = state !== null && state !== "new" ? state : null;

  return (
    <Modal
      open={state !== null}
      onClose={onClose}
      title={editing ? "Edit subject" : "Add subject"}
      description={editing ? "Change the subject's details." : "Create a new subject for questions and tests."}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID}>
            {editing ? "Save changes" : "Add subject"}
          </Button>
        </>
      }
    >
      {state !== null ? <SubjectForm key={editing?.id ?? "new"} subject={editing} onSaved={onClose} /> : null}
    </Modal>
  );
}
