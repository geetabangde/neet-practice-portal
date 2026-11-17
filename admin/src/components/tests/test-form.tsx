"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/common/page-header";
import { TestStatusBadge } from "@/components/common/status-badges";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SelectField, TextAreaField, TextField } from "@/components/ui/form-controls";
import { createTest, updateTest } from "@/lib/tests-api";
import type { MockTest, TestKind, TestPattern } from "@/types";

// Numbers are kept as text, because that is what a text box holds; they become numbers when saving
interface Values {
  title: string;
  description: string;
  kind: TestKind;
  pattern: TestPattern;
  durationMinutes: string;
  marksPerQuestion: string;
  negativeMarking: string;
  // YYYY-MM-DDTHH:mm, as given by <input type="datetime-local">
  startAt: string;
  endAt: string;
}

type Errors = Partial<Record<keyof Values, string>>;

const emptyValues: Values = {
  title: "",
  description: "",
  kind: "grand",
  pattern: "NEET",
  durationMinutes: "180",
  marksPerQuestion: "4",
  negativeMarking: "1",
  startAt: "",
  endAt: "",
};

const isPositive = (text: string) => Number.isFinite(Number(text)) && Number(text) > 0;

function validate(values: Values): Errors {
  const errors: Errors = {};
  if (!values.title.trim()) errors.title = "Give the test a title.";
  if (!isPositive(values.durationMinutes) || !Number.isInteger(Number(values.durationMinutes))) {
    errors.durationMinutes = "Enter the duration in whole minutes.";
  }
  if (!isPositive(values.marksPerQuestion)) errors.marksPerQuestion = "Enter the marks for each question.";
  const negative = Number(values.negativeMarking);
  if (values.negativeMarking.trim() === "" || !Number.isFinite(negative) || negative < 0) {
    errors.negativeMarking = "Enter 0 or more (0 means no negative marking).";
  } else if (isPositive(values.marksPerQuestion) && negative > Number(values.marksPerQuestion)) {
    errors.negativeMarking = "This cannot be more than the marks for a correct answer.";
  }
  if (!values.startAt) errors.startAt = "Choose when the test starts.";
  if (!values.endAt) errors.endAt = "Choose when the test ends.";
  else if (values.startAt && values.endAt <= values.startAt) errors.endAt = "The end must be after the start.";
  return errors;
}

// Making a test is one form: its basics. The questions are added afterwards, from the "Questions" button
// of the test in the list.
export function TestForm({ test }: { test?: MockTest }) {
  const router = useRouter();
  const toast = useToast();
  const { tests } = useAdminStore();

  const [values, setValues] = useState<Values>(
    test
      ? {
          title: test.title,
          description: test.description,
          kind: test.kind,
          pattern: test.pattern,
          durationMinutes: String(test.durationMinutes),
          marksPerQuestion: String(test.marksPerQuestion),
          negativeMarking: String(test.negativeMarking),
          startAt: test.startAt,
          endAt: test.endAt,
        }
      : emptyValues,
  );
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  function set<K extends keyof Values>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const fields = {
      title: values.title.trim(),
      description: values.description.trim(),
      kind: values.kind,
      pattern: values.pattern,
      durationMinutes: Number(values.durationMinutes),
      marksPerQuestion: Number(values.marksPerQuestion),
      negativeMarking: Number(values.negativeMarking),
      startAt: values.startAt,
      endAt: values.endAt,
    };

    setSaving(true);
    const result = test ? await updateTest(test.id, fields) : await createTest(fields);
    setSaving(false);
    if (!result.ok) {
      toast({ title: "The test was not saved", description: result.message, tone: "error" });
      return;
    }

    if (test) tests.update(test.id, result.data);
    else tests.add(result.data);

    toast({
      title: test ? "Test saved" : "Test created",
      description: test ? `${result.data.title} was saved.` : `${result.data.title} is a draft. Use its Questions button to add the questions.`,
    });
    router.push("/tests");
  }

  const editing = test !== undefined;

  return (
    <>
      <Link href="/tests" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to tests
      </Link>
      <PageHeader
        title={editing ? "Edit test" : "Create test"}
        description={
          editing
            ? "Change the test's details. Its questions are changed from the Questions button in the list."
            : "Fill in the details. You add the questions afterwards, from the Questions button in the list."
        }
      />

      <form onSubmit={onSubmit} noValidate>
        <Card>
          <CardContent className="space-y-5 sm:p-6">
            {editing ? (
              <p className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                Status: <TestStatusBadge status={test.status} />
                <span className="text-slate-500">Publish or complete the test from the list.</span>
              </p>
            ) : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Test title"
                required
                value={values.title}
                onChange={(e) => set("title", e.target.value)}
                error={errors.title}
                placeholder="e.g. Grand Test 6 - NEET Pattern"
                wrapperClassName="sm:col-span-2"
              />
              <SelectField label="Test type" value={values.kind} onChange={(e) => set("kind", e.target.value as TestKind)} hint="The tab of the student Test Series it shows in.">
                <option value="grand">Grand Test</option>
                <option value="mini">Mini Test</option>
                <option value="subject">Subject Test</option>
              </SelectField>
              <SelectField label="Pattern" value={values.pattern} onChange={(e) => set("pattern", e.target.value as TestPattern)}>
                <option value="NEET">NEET</option>
                <option value="INICET">INICET</option>
              </SelectField>
              <TextAreaField
                label="Description"
                rows={3}
                value={values.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="What the test covers, and any instructions for students"
                wrapperClassName="sm:col-span-2"
              />
              <TextField
                label="Duration (minutes)"
                required
                type="number"
                min={1}
                value={values.durationMinutes}
                onChange={(e) => set("durationMinutes", e.target.value)}
                error={errors.durationMinutes}
              />
              <TextField
                label="Marks per question"
                required
                type="number"
                min={0}
                step="any"
                value={values.marksPerQuestion}
                onChange={(e) => set("marksPerQuestion", e.target.value)}
                error={errors.marksPerQuestion}
                hint="Total marks = marks per question × number of questions."
              />
              <TextField
                label="Negative marking"
                required
                type="number"
                min={0}
                step="any"
                value={values.negativeMarking}
                onChange={(e) => set("negativeMarking", e.target.value)}
                error={errors.negativeMarking}
                hint="Marks removed for each wrong answer, for example 1 or 0.25. Write 0 for none."
              />
              <div className="hidden sm:block" />
              <TextField
                label="Start date and time"
                required
                type="datetime-local"
                value={values.startAt}
                onChange={(e) => set("startAt", e.target.value)}
                error={errors.startAt}
              />
              <TextField
                label="End date and time"
                required
                type="datetime-local"
                value={values.endAt}
                onChange={(e) => set("endAt", e.target.value)}
                error={errors.endAt}
              />
            </div>
          </CardContent>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
            <Link href="/tests" className={buttonStyles({ variant: "outline" })}>
              Cancel
            </Link>
            <Button type="submit" loading={saving}>
              {editing ? "Save changes" : "Create test"}
            </Button>
          </div>
        </Card>
      </form>
    </>
  );
}
