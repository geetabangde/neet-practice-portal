"use client";

import { useState, type FormEvent } from "react";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import { createModule, updateModule } from "@/lib/modules-api";
import type { ActiveStatus, Module, Subject } from "@/types";

const FORM_ID = "module-form";

// What the pop-up is doing: "new" = adding, a Module = editing it, null = closed
export type ModuleModalState = Module | "new" | null;

function ModuleForm({
  subject,
  module,
  onSaved,
  onSavingChange,
}: {
  subject: Subject;
  module: Module | null;
  onSaved: () => void;
  onSavingChange: (saving: boolean) => void;
}) {
  const { modules } = useAdminStore();
  const toast = useToast();

  const [name, setName] = useState(module?.name ?? "");
  const [status, setStatus] = useState<ActiveStatus>(module?.status ?? "active");
  const [nameError, setNameError] = useState<string>();
  const [formError, setFormError] = useState<string>();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setNameError("Enter the module name.");

    setFormError(undefined);
    onSavingChange(true);
    const result = module
      ? await updateModule(module.id, { name: trimmed, status })
      : await createModule({ subjectId: subject.id, name: trimmed, status });
    onSavingChange(false);

    if (!result.ok) {
      // 409 = the database says this subject already has a module with this name
      if (result.status === 409) setNameError(result.message);
      else setFormError(result.message);
      return;
    }
    if (module) {
      modules.update(module.id, result.data);
      toast({ title: "Module updated", description: `${result.data.name} was saved.` });
    } else {
      modules.add(result.data);
      toast({ title: "Module added", description: `${result.data.name} was added to ${subject.name}.` });
    }
    onSaved();
  }

  return (
    <form id={FORM_ID} onSubmit={onSubmit} noValidate className="space-y-4">
      <TextField
        label="Module name"
        required
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setNameError(undefined);
        }}
        error={nameError}
        placeholder="e.g. Limbs"
      />
      <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value as ActiveStatus)} hint="An inactive module is hidden from students, together with its topics.">
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </SelectField>

      {formError ? (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </p>
      ) : null}
    </form>
  );
}

export function ModuleFormModal({ subject, state, onClose }: { subject: Subject; state: ModuleModalState; onClose: () => void }) {
  const editing = state !== null && state !== "new" ? state : null;
  const [saving, setSaving] = useState(false);

  return (
    <Modal
      open={state !== null}
      onClose={onClose}
      title={editing ? "Edit module" : "Add module"}
      description={editing ? "Change the module's name or status." : `Create a module inside ${subject.name}.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={saving}>
            {editing ? "Save changes" : "Add module"}
          </Button>
        </>
      }
    >
      {state !== null ? (
        <ModuleForm key={editing?.id ?? "new"} subject={subject} module={editing} onSaved={onClose} onSavingChange={setSaving} />
      ) : null}
    </Modal>
  );
}
