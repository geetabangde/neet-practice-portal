"use client";

import { useState, type FormEvent } from "react";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import { createTopic, updateTopic } from "@/lib/topics-api";
import type { ActiveStatus, Topic } from "@/types";

const FORM_ID = "topic-form";

// "new" = adding, a Topic = editing it, null = closed
export type TopicModalState = Topic | "new" | null;

interface TopicErrors {
  name?: string;
  subjectId?: string;
  form?: string;
}

function TopicForm({
  topic,
  defaultSubjectId,
  onSaved,
  onSavingChange,
}: {
  topic: Topic | null;
  defaultSubjectId: string;
  onSaved: () => void;
  onSavingChange: (saving: boolean) => void;
}) {
  const { topics, subjects } = useAdminStore();
  const toast = useToast();

  const [name, setName] = useState(topic?.name ?? "");
  const [subjectId, setSubjectId] = useState(topic?.subjectId ?? defaultSubjectId);
  const [status, setStatus] = useState<ActiveStatus>(topic?.status ?? "active");
  const [errors, setErrors] = useState<TopicErrors>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    const found: TopicErrors = {};

    if (!subjectId) found.subjectId = "Choose the subject this topic belongs to.";
    if (!trimmed) found.name = "Enter the topic name.";
    else if (topics.items.some((t) => t.id !== topic?.id && t.subjectId === subjectId && t.name.toLowerCase() === trimmed.toLowerCase())) {
      found.name = "This subject already has a topic with this name.";
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onSavingChange(true);
    const fields = { subjectId, name: trimmed, status };
    const result = topic ? await updateTopic(topic.id, fields) : await createTopic(fields);
    onSavingChange(false);

    if (!result.ok) {
      // 409 = the database says this name is taken inside the subject
      setErrors(result.status === 409 ? { name: result.message } : { form: result.message });
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
      <SelectField
        label="Subject"
        required
        value={subjectId}
        onChange={(e) => setSubjectId(e.target.value)}
        error={errors.subjectId}
      >
        <option value="">Choose a subject</option>
        {subjects.items.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.name}
          </option>
        ))}
      </SelectField>
      <TextField
        label="Topic name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        placeholder="e.g. Upper Limb"
      />
      <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value as ActiveStatus)}>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </SelectField>

      {errors.form ? (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.form}
        </p>
      ) : null}
    </form>
  );
}

interface TopicFormModalProps {
  state: TopicModalState;
  // The subject filter of the list page, so "Add topic" starts with it chosen
  defaultSubjectId: string;
  onClose: () => void;
}

export function TopicFormModal({ state, defaultSubjectId, onClose }: TopicFormModalProps) {
  const editing = state !== null && state !== "new" ? state : null;
  const [saving, setSaving] = useState(false);

  return (
    <Modal
      open={state !== null}
      onClose={onClose}
      title={editing ? "Edit topic" : "Add topic"}
      description={editing ? "Change the topic's details." : "Create a topic inside a subject."}
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
          key={editing?.id ?? "new"}
          topic={editing}
          defaultSubjectId={defaultSubjectId}
          onSaved={onClose}
          onSavingChange={setSaving}
        />
      ) : null}
    </Modal>
  );
}
