"use client";

import { ArrowDown, ArrowLeft, ArrowUp, ClipboardList, Download, Lock, Pencil, Plus, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/common/page-header";
import { TestStatusBadge } from "@/components/common/status-badges";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SelectField, TextAreaField } from "@/components/ui/form-controls";
import { ImageUpload, type ChosenImage } from "@/components/questions/image-upload";
import { TestParts } from "./test-parts";
import { RichText } from "@/components/ui/rich-text";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { cn } from "@/lib/cn";
import { plural } from "@/lib/format";
import { imageUrl, uploadQuestionImage } from "@/lib/images-api";
import { openBundle, uploadPictures } from "@/lib/import-bundle";
import { downloadTestQuestionSample, downloadTestQuestionTemplate, readTestQuestionFile, type ImportedQuestion, type ReadProblem } from "@/lib/import-test-questions";
import {
  addTestQuestions,
  deleteTestQuestion,
  fetchTestQuestions,
  reorderTestQuestions,
  updateTestQuestion,
  type TestQuestion,
  type TestQuestionFields,
} from "@/lib/test-questions-api";
import { fetchTestSections, type SectionsReply, type TestSection } from "@/lib/test-sections-api";
import type { ApiResult } from "@/lib/api";
import type { MockTest, OptionKey, QuestionType } from "@/types";

const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D"];

// The page behind the "Questions" button of a test: write the questions of this test. They are separate from the QBank.
export function TestQuestions({ id }: { id: string }) {
  const { tests, contentStatus, reloadContent } = useAdminStore();
  const test = tests.items.find((t) => t.id === id);

  // Opened straight from a link: wait for the server before saying the test is missing
  if (!test && contentStatus === "loading") {
    return (
      <p role="status" className="py-16 text-center text-sm text-slate-500">
        Loading test…
      </p>
    );
  }
  if (!test) {
    return (
      <Card>
        <EmptyState
          icon={ClipboardList}
          title={contentStatus === "error" ? "Could not load the test" : "Test not found"}
          description={contentStatus === "error" ? "The server did not respond. Check that the backend is running." : "This test does not exist. It may have been deleted."}
          action={
            contentStatus === "error" ? (
              <Button onClick={reloadContent}>Try again</Button>
            ) : (
              <Link href="/tests" className={buttonStyles()}>
                Back to tests
              </Link>
            )
          }
        />
      </Card>
    );
  }

  return <QuestionAuthor key={test.id} test={test} />;
}

type Editing = { kind: "new" } | { kind: "edit"; question: TestQuestion } | null;

function QuestionAuthor({ test }: { test: MockTest }) {
  const toast = useToast();
  const { tests, results } = useAdminStore();

  const [questions, setQuestions] = useState<TestQuestion[] | null>(null);
  // The parts (Part A, Part B ...) of the test. Empty when it has none.
  const [sections, setSections] = useState<TestSection[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [editing, setEditing] = useState<Editing>(null);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState<TestQuestion | null>(null);
  const [busy, setBusy] = useState(false);
  // Students have taken the test: from the results we know, or when the server says so
  const [lockedByServer, setLockedByServer] = useState(false);
  const locked = lockedByServer || results.some((result) => result.testId === test.id);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [result, parts] = await Promise.all([fetchTestQuestions(test.id), fetchTestSections(test.id)]);
      if (cancelled) return;
      if (result.ok && parts.ok) {
        setQuestions(result.data);
        setSections(parts.data.sections);
        setLoadError(null);
      } else {
        setLoadError(!result.ok ? result.message : !parts.ok ? parts.message : "");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [test.id, attempt]);

  // Runs a change on the server and shows the new list. Returns true when it worked.
  async function change(request: Promise<ApiResult<TestQuestion[]>>, done: string): Promise<boolean> {
    setBusy(true);
    const result = await request;
    setBusy(false);
    if (!result.ok) {
      if (result.status === 409) setLockedByServer(true);
      toast({ title: "Not saved", description: result.message, tone: "error" });
      return false;
    }
    setQuestions(result.data);
    tests.update(test.id, { questionCount: result.data.length });
    toast({ title: done });
    return true;
  }

  async function move(index: number, by: -1 | 1) {
    if (!questions) return;
    const target = index + by;
    if (target < 0 || target >= questions.length) return;
    // A question moves inside its part: it cannot jump over the border of the part
    if (questions[target].sectionId !== questions[index].sectionId) return;
    const ids = questions.map((q) => q.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    await change(reorderTestQuestions(test.id, ids), "Order saved");
  }

  // The parts changed: show them, the new duration of the test, and read the questions again (they may have moved between parts)
  function partsChanged(reply: SectionsReply) {
    setSections(reply.sections);
    tests.update(test.id, { durationMinutes: reply.durationMinutes, sectionCount: reply.sections.length });
    setAttempt((value) => value + 1);
  }

  const total = questions?.length ?? test.questionCount;
  const totalMarks = Math.round(total * test.marksPerQuestion * 100) / 100;
  const partCount = sections?.length ?? test.sectionCount;
  // A new question goes into the last part, unless the admin picks another
  const defaultPartId = sections && sections.length > 0 ? sections[sections.length - 1].id : "";

  // The list of questions, in the order students get them. Grouped by part when the test has parts.
  const indexed = (questions ?? []).map((question, index) => ({ question, index }));
  const groups =
    sections && sections.length > 0
      ? sections.map((section) => ({
          id: section.id,
          heading: `${section.name} · ${plural(section.questionCount, "question")} · ${section.durationMinutes} min`,
          items: indexed.filter((item) => item.question.sectionId === section.id),
        }))
      : [{ id: "all", heading: null as string | null, items: indexed }];

  return (
    <>
      <Link href="/tests" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to tests
      </Link>
      <PageHeader
        title={test.title}
        description="Write the questions of this test. They belong to this test only: they are not in the QBank, and no subject or topic is needed."
        actions={
          <>
            <Button
              variant="outline"
              leftIcon={<Upload className="h-4 w-4" />}
              disabled={locked || busy}
              onClick={() => {
                setImporting(true);
                setEditing(null);
              }}
            >
              Import from file
            </Button>
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              disabled={locked || busy}
              onClick={() => {
                setEditing({ kind: "new" });
                setImporting(false);
              }}
            >
              Add question
            </Button>
          </>
        }
      />

      <Card className="mb-5">
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
          <TestStatusBadge status={test.status} />
          <span>
            <strong className="text-slate-900">{plural(total, "question")}</strong> · {totalMarks} marks in all
          </span>
          <span>{partCount > 0 ? `${plural(partCount, "part")} · ${test.durationMinutes} min in all` : `${test.durationMinutes} min, one timer`}</span>
          <span>
            {test.marksPerQuestion} marks for a right answer · negative marking {test.negativeRatio} (−{test.negativeMarking})
          </span>
          {test.status === "draft" && total > 0 ? <span className="text-slate-500">Publish the test from the test list when it is ready.</span> : null}
        </CardContent>
      </Card>

      {locked ? (
        <div role="status" className="mb-5 flex items-start gap-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Students have already taken this test, so its questions can no longer be changed.
        </div>
      ) : null}

      {sections ? <TestParts test={test} sections={sections} locked={locked} onChanged={partsChanged} /> : null}

      {importing ? (
        <ImportPanel
          sections={sections ?? []}
          onClose={() => setImporting(false)}
          busy={busy}
          onImport={async (list) => {
            const ok = await change(addTestQuestions(test.id, list), `${plural(list.length, "question")} added`);
            if (ok) setImporting(false);
            return ok;
          }}
        />
      ) : null}

      {editing ? (
        <QuestionForm
          key={editing.kind === "edit" ? editing.question.id : "new"}
          sections={sections ?? []}
          defaultPartId={defaultPartId}
          initial={editing.kind === "edit" ? editing.question : undefined}
          busy={busy}
          onCancel={() => setEditing(null)}
          onSave={async (fields, addAnother) => {
            const ok =
              editing.kind === "edit"
                ? await change(updateTestQuestion(test.id, editing.question.id, fields), "Question saved")
                : await change(addTestQuestions(test.id, [fields]), "Question added");
            if (ok && !(editing.kind === "new" && addAnother)) setEditing(null);
            return ok;
          }}
        />
      ) : null}

      {loadError ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load the questions: {loadError}
          <Button size="sm" variant="outline" onClick={() => setAttempt((value) => value + 1)}>
            Try again
          </Button>
        </div>
      ) : questions === null ? (
        <p role="status" className="py-10 text-center text-sm text-slate-500">
          Loading the questions…
        </p>
      ) : questions.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title="No questions yet"
            description="Add the first question, or import many at once from an Excel or CSV file."
            action={
              locked ? undefined : (
                <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing({ kind: "new" })}>
                  Add question
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.id} aria-label={group.heading ?? "Questions"}>
              {group.heading ? <h3 className="mb-3 text-sm font-semibold text-slate-900">{group.heading}</h3> : null}
              {group.items.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">No questions in this part yet.</p> : null}
              <ol className="space-y-3">
          {group.items.map(({ question, index }) => (
            <li key={question.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start gap-3">
                <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-indigo-50 px-2 text-sm font-semibold text-indigo-700">{index + 1}</span>
                <div className="min-w-0 flex-1 basis-64">
                  <p className="whitespace-pre-line text-sm font-medium text-slate-900">{question.text}</p>
                  {question.imageToken ? (
                    <a href={imageUrl(question.imageToken)} target="_blank" rel="noopener noreferrer" title="Open the image" className="mt-2 inline-block">
                      {/* The picture comes from the API, not from this panel: a plain <img> shows it */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl(question.imageToken)} alt={`Image of question ${index + 1}`} loading="lazy" className="max-h-32 max-w-full rounded-md border border-slate-200 bg-white object-contain" />
                    </a>
                  ) : null}
                </div>
                <div className="flex items-center gap-1">
                  {question.type === "multiple" ? <Badge tone="violet">Multiple answer</Badge> : null}
                  <Button variant="ghost" size="sm" aria-label={`Move question ${index + 1} up`} disabled={locked || busy || index === 0 || questions[index - 1].sectionId !== question.sectionId} onClick={() => void move(index, -1)}>
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" size="sm" aria-label={`Move question ${index + 1} down`} disabled={locked || busy || index === questions.length - 1 || questions[index + 1].sectionId !== question.sectionId} onClick={() => void move(index, 1)}>
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Edit question ${index + 1}`}
                    disabled={locked || busy}
                    onClick={() => {
                      setEditing({ kind: "edit", question });
                      setImporting(false);
                    }}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" size="sm" aria-label={`Delete question ${index + 1}`} disabled={locked || busy} onClick={() => setDeleting(question)}>
                    <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                  </Button>
                </div>
              </div>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {OPTION_KEYS.map((key) => {
                  const right = question.correct.includes(key);
                  return (
                    <li key={key} className={cn("flex items-start gap-2 rounded-lg border px-3 py-2 text-sm", right ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-700")}>
                      <span className="font-semibold">{key}.</span>
                      <RichText value={question.options[key]} className="min-w-0 flex-1" />
                      {right ? <span className="text-xs font-semibold text-emerald-700">✓ Right</span> : null}
                    </li>
                  );
                })}
              </ul>
              {question.explanation || question.reference ? (
                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  {question.explanation ? (
                    <div>
                      <strong className="text-slate-700">Explanation:</strong>
                      <RichText value={question.explanation} className="mt-1" />
                    </div>
                  ) : null}
                  {question.reference ? (
                    <p>
                      <strong className="text-slate-700">Reference:</strong> {question.reference}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
              </ol>
            </section>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          const target = deleting;
          setDeleting(null);
          if (target) void change(deleteTestQuestion(test.id, target.id), "Question deleted");
        }}
        title="Delete this question?"
        description={deleting && questions ? <>Question {questions.findIndex((q) => q.id === deleting.id) + 1} will be removed from this test. This cannot be undone.</> : null}
        confirmLabel="Delete question"
      />
    </>
  );
}

// ---- The form that writes or edits one question ---------------------------------------------------------

interface FormValues {
  text: string;
  type: QuestionType;
  options: Record<OptionKey, string>;
  correct: OptionKey[];
  explanation: string;
  reference: string;
}

type FormErrors = Partial<Record<"text" | "options" | "correct", string>>;

const emptyForm: FormValues = { text: "", type: "single", options: { A: "", B: "", C: "", D: "" }, correct: [], explanation: "", reference: "" };

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.text.trim()) errors.text = "Write the question.";
  if (OPTION_KEYS.some((key) => !values.options[key].trim())) errors.options = "Write all four options.";
  if (values.correct.length === 0) errors.correct = "Choose the right answer.";
  else if (values.type === "multiple" && values.correct.length < 2) errors.correct = "A multiple-answer question needs at least two right options.";
  return errors;
}

function QuestionForm({
  initial,
  sections,
  defaultPartId,
  busy,
  onCancel,
  onSave,
}: {
  initial?: TestQuestion;
  // The parts of the test (empty when it has none) and the one a new question starts in
  sections: TestSection[];
  defaultPartId: string;
  busy: boolean;
  onCancel: () => void;
  // addAnother: keep the form open for the next question. Returns true when the question was saved.
  onSave: (fields: TestQuestionFields, addAnother: boolean) => Promise<boolean>;
}) {
  const [values, setValues] = useState<FormValues>(
    initial
      ? { text: initial.text, type: initial.type, options: { ...initial.options }, correct: [...initial.correct], explanation: initial.explanation, reference: initial.reference }
      : emptyForm,
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [partId, setPartId] = useState(initial?.sectionId ?? defaultPartId);
  // The picture of the question: a saved one, or a file just chosen (uploaded when the question is saved)
  const [image, setImage] = useState<ChosenImage | null>(
    initial?.imageToken ? { name: initial.imageName || "Question image", previewUrl: imageUrl(initial.imageToken), token: initial.imageToken } : null,
  );
  const [imageError, setImageError] = useState<string>();
  const [uploading, setUploading] = useState(false);

  function setType(type: QuestionType) {
    setValues((prev) => ({ ...prev, type, correct: type === "single" ? prev.correct.slice(0, 1) : prev.correct }));
  }

  function toggle(key: OptionKey) {
    setValues((prev) => {
      if (prev.type === "single") return { ...prev, correct: [key] };
      return { ...prev, correct: prev.correct.includes(key) ? prev.correct.filter((k) => k !== key) : [...prev.correct, key].sort() };
    });
    setErrors((prev) => ({ ...prev, correct: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>, addAnother: boolean) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    // A picture chosen just now is uploaded first: the question then keeps its token
    let imageToken = image?.token ?? null;
    if (image?.file) {
      setUploading(true);
      const uploaded = await uploadQuestionImage(image.file);
      setUploading(false);
      if (!uploaded.ok) {
        setImageError(uploaded.message);
        return;
      }
      imageToken = uploaded.data.token;
    }

    const saved = await onSave(
      {
        text: values.text.trim(),
        type: values.type,
        options: { A: values.options.A.trim(), B: values.options.B.trim(), C: values.options.C.trim(), D: values.options.D.trim() },
        correct: values.correct,
        explanation: values.explanation.trim(),
        reference: values.reference.trim(),
        imageName: imageToken ? (image?.name ?? "") : "",
        imageToken,
        sectionId: sections.length > 0 ? partId || sections[0].id : null,
      },
      addAnother,
    );
    if (saved && addAnother) {
      setValues(emptyForm);
      setImage(null);
      document.getElementById("test-question-text")?.focus();
    }
  }

  return (
    <form onSubmit={(event) => void submit(event, false)} noValidate className="mb-5">
      <Card>
        <CardContent className="space-y-5 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900">{initial ? `Edit question ${initial.position}` : "New question"}</h2>

          <TextAreaField
            id="test-question-text"
            label="Question"
            required
            rows={3}
            value={values.text}
            onChange={(e) => {
              setValues((prev) => ({ ...prev, text: e.target.value }));
              setErrors((prev) => ({ ...prev, text: undefined }));
            }}
            error={errors.text}
          />

          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Question image</p>
            <ImageUpload value={image} onChange={setImage} error={imageError} onError={setImageError} />
          </div>

          {sections.length > 0 ? (
            <SelectField label="Part of the test" value={partId || sections[0].id} onChange={(e) => setPartId(e.target.value)} hint="Students get the questions part by part." wrapperClassName="sm:max-w-xs">
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </SelectField>
          ) : null}

          <SelectField label="Type" value={values.type} onChange={(e) => setType(e.target.value as QuestionType)} wrapperClassName="sm:max-w-xs">
            <option value="single">Single answer (one right option)</option>
            <option value="multiple">Multiple answer (two or more right options)</option>
          </SelectField>

          <fieldset>
            <legend className="text-sm font-medium text-slate-700">
              Options and the right answer <span className="text-red-600">*</span>
            </legend>
            <p className="mt-0.5 text-xs text-slate-500">{values.type === "single" ? "Tick the one right option." : "Tick every right option (at least two)."}</p>
            <div className="mt-3 space-y-3">
              {OPTION_KEYS.map((key) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">{key}</span>
                  <div className="min-w-0 flex-1">
                    <RichTextEditor
                      compact
                      hideLabel
                      label={`Option ${key}`}
                      value={values.options[key]}
                      error={undefined}
                      onChange={(html) => {
                        setValues((prev) => ({ ...prev, options: { ...prev.options, [key]: html } }));
                        setErrors((prev) => ({ ...prev, options: undefined }));
                      }}
                    />
                  </div>
                  <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-sm text-slate-700">
                    <input
                      type={values.type === "single" ? "radio" : "checkbox"}
                      name="right-option"
                      checked={values.correct.includes(key)}
                      onChange={() => toggle(key)}
                      className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500"
                    />
                    Right
                  </label>
                </div>
              ))}
            </div>
            {errors.options ? <p className="mt-2 text-xs text-red-600">{errors.options}</p> : null}
            {errors.correct ? <p className="mt-2 text-xs text-red-600">{errors.correct}</p> : null}
          </fieldset>

          <RichTextEditor
            label="Explanation"
            value={values.explanation}
            onChange={(html) => setValues((prev) => ({ ...prev, explanation: html }))}
            hint="Students see this, with the right answer, only after they submit the test. Use the bar for bold, lists, tables and links."
          />
          <TextAreaField
            label="Reference"
            rows={2}
            value={values.reference}
            onChange={(e) => setValues((prev) => ({ ...prev, reference: e.target.value }))}
            hint="The book or source, for example: Harrison, 21st edition, page 443."
          />
        </CardContent>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          {initial ? null : (
            <Button variant="secondary" loading={busy} onClick={(event) => void submit(event as unknown as FormEvent<HTMLFormElement>, true)}>
              Save and add another
            </Button>
          )}
          <Button type="submit" loading={busy || uploading}>
            {initial ? "Save changes" : "Save question"}
          </Button>
        </div>
      </Card>
    </form>
  );
}

// ---- Import many questions from a file (with pictures) -----------------------------------------------------

type Analysis = { ok: true; ready: ImportedQuestion[]; problems: ReadProblem[] } | { ok: false; message: string };

function ImportPanel({ sections, onClose, busy, onImport }: { sections: TestSection[]; onClose: () => void; busy: boolean; onImport: (questions: TestQuestionFields[]) => Promise<boolean> }) {
  // The part the imported questions go into (a test with parts only)
  const [partId, setPartId] = useState("");
  const [reading, setReading] = useState(false);
  // The spreadsheet or zip chosen, and the pictures chosen next to it
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [extraPictures, setExtraPictures] = useState<File[]>([]);
  const [pictures, setPictures] = useState<Map<string, File>>(new Map());
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Opens the file (a zip is unpacked), reads the questions, and checks that every picture a question names is there
  async function analyse(file: File, extras: File[]) {
    setReading(true);
    setAnalysis(null);
    setUploadError(null);
    const bundle = await openBundle(file, extras);
    if (!bundle.ok) {
      setAnalysis({ ok: false, message: bundle.message });
      setReading(false);
      return;
    }
    const read = await readTestQuestionFile(bundle.sheet);
    if (!read.ok) {
      setAnalysis({ ok: false, message: read.message });
      setReading(false);
      return;
    }
    const ready: ImportedQuestion[] = [];
    const problems: ReadProblem[] = [...read.problems];
    for (const question of read.questions) {
      if (question.imageFile !== null && !bundle.pictures.has(question.imageFile)) {
        problems.push({ row: question.row, message: `The picture "${question.imageName}" was not found. Put it in the zip file, or choose it under "Pictures".` });
      } else {
        ready.push(question);
      }
    }
    problems.sort((a, b) => a.row - b.row);
    setPictures(bundle.pictures);
    setAnalysis({ ok: true, ready, problems });
    setReading(false);
  }

  async function add() {
    if (!analysis || !analysis.ok) return;
    setUploadError(null);
    // Every picture the questions use is sent first (once each); the questions then keep the tokens
    const keys = analysis.ready.map((question) => question.imageFile).filter((key): key is string => key !== null);
    if (keys.length > 0) setProgress("Uploading the pictures…");
    const uploaded = await uploadPictures(keys, pictures, (done, total) => setProgress(`Uploading the pictures: ${done} of ${total}…`));
    setProgress(null);
    if (!uploaded.ok) {
      setUploadError(uploaded.message);
      return;
    }
    await onImport(
      analysis.ready.map((question) => ({
        text: question.text,
        type: question.type,
        options: question.options,
        correct: question.correct,
        explanation: question.explanation,
        reference: question.reference,
        imageName: question.imageFile === null ? "" : question.imageName,
        imageToken: question.imageFile === null ? null : (uploaded.tokens.get(question.imageFile) ?? null),
        sectionId: sections.length > 0 ? partId || sections[0].id : null,
      })),
    );
  }

  const ready = analysis && analysis.ok ? analysis.ready : [];
  const problems = analysis && analysis.ok ? analysis.problems : [];
  const withPicture = ready.filter((question) => question.imageFile !== null).length;
  const working = reading || progress !== null || busy;

  return (
    <Card className="mb-5">
      <CardContent className="space-y-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <h2 className="text-base font-semibold text-slate-900">Import questions from a file</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              A .csv or Excel (.xlsx) file with one question in each row. The columns are: question, option_a, option_b, option_c, option_d, correct (like A or A,C),
              explanation, reference, type (optional) and <strong>image</strong> (optional: the file name of the question&apos;s picture, like xray.png). Up to 500
              questions per file. They are added after the questions the test already has.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              <strong>Pictures:</strong> put the spreadsheet and the pictures in one <strong>.zip</strong> file and choose the zip. Or choose the spreadsheet, and the
              pictures under &quot;Pictures&quot; below. Each picture is a PNG, JPG, WebP or GIF of up to 2 MB.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={() => void downloadTestQuestionSample()}>
              Download sample (zip with pictures)
            </Button>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={downloadTestQuestionTemplate}>
              Download template (CSV)
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="import-file" className="mb-1.5 block text-sm font-medium text-slate-700">
              File (.zip, .csv or .xlsx)
            </label>
            <input
              id="import-file"
              type="file"
              accept=".zip,.csv,.xlsx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setMainFile(file);
                void analyse(file, extraPictures);
              }}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
          <div>
            <label htmlFor="import-pictures" className="mb-1.5 block text-sm font-medium text-slate-700">
              Pictures (optional, when you did not use a zip)
            </label>
            <input
              id="import-pictures"
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = "";
                setExtraPictures(files);
                if (mainFile) void analyse(mainFile, files);
              }}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {extraPictures.length > 0 ? <p className="mt-1 text-xs text-slate-500">{plural(extraPictures.length, "picture")} chosen</p> : null}
          </div>
        </div>

        {sections.length > 0 ? (
          <SelectField label="Add the questions to" value={partId || sections[0].id} onChange={(e) => setPartId(e.target.value)} wrapperClassName="sm:max-w-xs">
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </SelectField>
        ) : null}

        {reading ? (
          <p role="status" className="text-sm text-slate-500">
            Reading {mainFile?.name}…
          </p>
        ) : null}
        {analysis && !analysis.ok ? (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {analysis.message}
          </p>
        ) : null}
        {analysis && analysis.ok ? (
          <div role="status" className="space-y-3 text-sm">
            <p className="text-slate-700">
              <strong>{mainFile?.name}</strong>: {plural(ready.length, "question")} ready to add
              {withPicture > 0 ? ` (${plural(withPicture, "question")} with a picture)` : ""}
              {problems.length > 0 ? `, ${plural(problems.length, "row")} with a problem (these are left out)` : ""}.
            </p>
            {problems.length > 0 ? (
              <ul className="max-h-40 list-disc space-y-1 overflow-y-auto rounded-lg bg-amber-50 py-3 pl-8 pr-4 text-amber-900">
                {problems.slice(0, 50).map((problem) => (
                  <li key={`${problem.row}-${problem.message}`}>
                    Row {problem.row}: {problem.message}
                  </li>
                ))}
                {problems.length > 50 ? <li>…and {problems.length - 50} more.</li> : null}
              </ul>
            ) : null}
          </div>
        ) : null}
        {progress ? (
          <p role="status" className="text-sm text-slate-600">
            {progress}
          </p>
        ) : null}
        {uploadError ? (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {uploadError}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={working}>
            Close
          </Button>
          <Button disabled={ready.length === 0 || reading} loading={busy || progress !== null} onClick={() => void add()}>
            {ready.length > 0 ? `Add ${plural(ready.length, "question")}` : "Add questions"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
