"use client";

import { useState, type FormEvent } from "react";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import { createTopic, updateTopic } from "@/lib/topics-api";
import type { ActiveStatus, Module, Topic } from "@/types";

const FORM_ID = "topic-form";

// What the pop-up is doing. "moduleId" is the module the topic is added to (or is in, when editing).
// null = closed.
export type TopicModalState = { moduleId: string; topic: Topic | null } | null;

function TopicForm({
  modulesOfSubject,
  moduleId: startModuleId,
  topic,
  onSaved,
  onSavingChange,
}: {
  // Only the modules of this subject: a topic can not move to another subject
  modulesOfSubject: Module[];
  moduleId: string;
  topic: Topic | null;
  onSaved: () => void;
  onSavingChange: (saving: boolean) => void;
}) {
  const { topics } = useAdminStore();
  const toast = useToast();

  const [moduleId, setModuleId] = useState(startModuleId);
  const [name, setName] = useState(topic?.name ?? "");
  const [status, setStatus] = useState<ActiveStatus>(topic?.status ?? "active");
  const [nameError, setNameError] = useState<string>();
  const [formError, setFormError] = useState<string>();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setNameError("Enter the topic name.");

    setFormError(undefined);
    onSavingChange(true);
    const fields = { moduleId, name: trimmed, status };
    const result = topic ? await updateTopic(topic.id, fields) : await createTopic(fields);
    onSavingChange(false);

    if (!result.ok) {
      // 409 = the database says this module already has a topic with this name
      if (result.status === 409) setNameError(result.message);
      else setFormError(result.message);
      return;
    }
    if (topic) {
      topics.update(topic.id, result.data);
      toast({ title: "Topic updated", description: `${result.data.name} was saved.` });
    } else {
      topics.add(result.data);
      toast({ title: "Topic added", description: `${result.data.name} was added.` });
    }
    onSaved();
  }

  return (
    <form id={FORM_ID} onSubmit={onSubmit} noValidate className="space-y-4">
      <SelectField label="Module" value={moduleId} onChange={(e) => setModuleId(e.target.value)} hint={topic ? "Change this to move the topic to another module." : undefined}>
        {modulesOfSubject.map((module) => (
          <option key={module.id} value={module.id}>
            {module.name}
          </option>
        ))}
      </SelectField>
      <TextField
        label="Topic name"
        required
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setNameError(undefined);
        }}
        error={nameError}
        placeholder="e.g. Upper Limb"
      />
      <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value as ActiveStatus)}>
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

export function TopicFormModal({
  modulesOfSubject,
  state,
  onClose,
}: {
  modulesOfSubject: Module[];
  state: TopicModalState;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const editing = state?.topic ?? null;

  return (
    <Modal
      open={state !== null}
      onClose={onClose}
      title={editing ? "Edit topic" : "Add topic"}
      description={editing ? "Change the topic's name, module or status." : "Create a topic inside a module."}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={saving}>
            {editing ? "Save changes" : "Add topic"}
          </Button>
        </>
      }
    >
      {state !== null ? (
        <TopicForm
          key={editing?.id ?? `new-${state.moduleId}`}
          modulesOfSubject={modulesOfSubject}
          moduleId={state.moduleId}
          topic={editing}
          onSaved={onClose}
          onSavingChange={setSaving}
        />
      ) : null}
    </Modal>
  );
}
