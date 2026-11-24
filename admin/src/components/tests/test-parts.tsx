"use client";

import { ArrowDown, ArrowUp, Clock, Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TextAreaField, TextField } from "@/components/ui/form-controls";
import { plural } from "@/lib/format";
import type { ApiResult } from "@/lib/api";
import {
  addTestSection,
  deleteTestSection,
  reorderTestSections,
  updateTestSection,
  type SectionFields,
  type SectionsReply,
  type TestSection,
} from "@/lib/test-sections-api";
import type { MockTest } from "@/types";

type Form = { kind: "new" } | { kind: "edit"; section: TestSection } | null;

// The parts (Part A, Part B ...) of a test. Each part has its own timer, and a student cannot go on to the next part
// until the time of the part he is in runs out. A test with no parts has one timer for the whole test.
export function TestParts({
  test,
  sections,
  locked,
  onChanged,
}: {
  test: MockTest;
  sections: TestSection[];
  locked: boolean;
  // Called with the new parts after every change that worked
  onChanged: (reply: SectionsReply) => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<Form>(null);
  const [deleting, setDeleting] = useState<TestSection | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(request: Promise<ApiResult<SectionsReply>>, done: string): Promise<boolean> {
    setBusy(true);
    const result = await request;
    setBusy(false);
    if (!result.ok) {
      toast({ title: "Not saved", description: result.message, tone: "error" });
      return false;
    }
    onChanged(result.data);
    toast({ title: done });
    return true;
  }

  async function move(index: number, by: -1 | 1) {
    const target = index + by;
    if (target < 0 || target >= sections.length) return;
    const ids = sections.map((section) => section.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    await run(reorderTestSections(test.id, ids), "Order saved");
  }

  return (
    <Card className="mb-5">
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Layers className="h-4 w-4 text-indigo-600" aria-hidden="true" />
              Parts of this test
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Cut the test into parts (Part A, Part B ...), each with its own timer. A student in Part A <strong>cannot go to Part B until the time of Part A runs out</strong>, and
              cannot go back to a part that is over. Without parts the test has one timer for the whole test.
            </p>
          </div>
          <Button variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />} disabled={locked || busy || form !== null} onClick={() => setForm({ kind: "new" })}>
            Add a part
          </Button>
        </div>

        {sections.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
            This test has no parts. It runs for {test.durationMinutes} minutes as one block. Add a part to start cutting it up: the questions you already wrote go into the first part.
          </p>
        ) : (
          <ol className="space-y-2">
            {sections.map((section, index) => (
              <li key={section.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                <Badge tone="indigo">{section.name}</Badge>
                <span className="flex items-center gap-1 text-sm text-slate-600">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {section.durationMinutes} min
                </span>
                <span className="text-sm text-slate-600">{plural(section.questionCount, "question")}</span>
                {section.instructions ? <span className="min-w-0 flex-1 basis-48 truncate text-xs text-slate-500">{section.instructions}</span> : <span className="flex-1" />}
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" aria-label={`Move ${section.name} up`} disabled={locked || busy || index === 0} onClick={() => void move(index, -1)}>
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" size="sm" aria-label={`Move ${section.name} down`} disabled={locked || busy || index === sections.length - 1} onClick={() => void move(index, 1)}>
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" size="sm" aria-label={`Edit ${section.name}`} disabled={locked || busy} onClick={() => setForm({ kind: "edit", section })}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" size="sm" aria-label={`Delete ${section.name}`} disabled={locked || busy} onClick={() => setDeleting(section)}>
                    <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            ))}
            <li className="px-1 text-sm text-slate-600">
              The test lasts <strong className="text-slate-900">{test.durationMinutes} minutes</strong> in all: the time of its parts together.
            </li>
          </ol>
        )}

        {form ? (
          <PartForm
            key={form.kind === "edit" ? form.section.id : "new"}
            initial={form.kind === "edit" ? form.section : undefined}
            placeholderName={`Part ${String.fromCharCode(65 + (form.kind === "edit" ? form.section.position - 1 : sections.length))}`}
            busy={busy}
            onCancel={() => setForm(null)}
            onSave={async (fields) => {
              const ok = await run(form.kind === "edit" ? updateTestSection(test.id, form.section.id, fields) : addTestSection(test.id, fields), form.kind === "edit" ? "Part saved" : "Part added");
              if (ok) setForm(null);
            }}
          />
        ) : null}
      </CardContent>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          const target = deleting;
          setDeleting(null);
          if (target) void run(deleteTestSection(test.id, target.id), "Part deleted");
        }}
        title="Delete this part?"
        description={
          deleting ? (
            <>
              {deleting.name} will be deleted.{" "}
              {deleting.questionCount > 0 ? `Its ${plural(deleting.questionCount, "question")} will move to ${sections.length > 1 ? "a neighbouring part" : "the test (it will have no parts)"}.` : "It has no questions."}
            </>
          ) : null
        }
        confirmLabel="Delete part"
      />
    </Card>
  );
}

function PartForm({
  initial,
  placeholderName,
  busy,
  onCancel,
  onSave,
}: {
  initial?: TestSection;
  placeholderName: string;
  busy: boolean;
  onCancel: () => void;
  onSave: (fields: SectionFields) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [minutes, setMinutes] = useState(initial ? String(initial.durationMinutes) : "60");
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [error, setError] = useState<string>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(minutes);
    if (!Number.isInteger(value) || value < 1) {
      setError("Enter the time in whole minutes.");
      return;
    }
    setError(undefined);
    await onSave({ name: name.trim(), durationMinutes: value, instructions: instructions.trim() });
  }

  return (
    <form onSubmit={(event) => void submit(event)} noValidate className="space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{initial ? `Edit ${initial.name}` : "New part"}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholderName} hint="Leave it empty to call it by its place (Part A, Part B ...)." maxLength={60} />
        <TextField
          label="Time of this part (minutes)"
          required
          type="number"
          min={1}
          value={minutes}
          onChange={(e) => {
            setMinutes(e.target.value);
            setError(undefined);
          }}
          error={error}
          hint="The student cannot leave the part before this time is over."
        />
      </div>
      <TextAreaField
        label="Instructions (shown with the (i) button of the part)"
        rows={3}
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        placeholder="For example: This part has 60 MCQs. Each right answer gives 4 marks."
        maxLength={1000}
      />
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" loading={busy}>
          {initial ? "Save part" : "Add part"}
        </Button>
      </div>
    </form>
  );
}
