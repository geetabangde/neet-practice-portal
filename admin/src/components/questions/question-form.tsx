"use client";

import { ArrowLeft, Save, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox, SelectField, TextAreaField, TextField } from "@/components/ui/form-controls";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/cn";
import { nextId, todayIso } from "@/lib/ids";
import type { Difficulty, OptionKey, Question, QuestionStatus, QuestionType } from "@/types";
import { ImageUpload, type ChosenImage } from "./image-upload";

const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D"];
const TEXT_LIMIT = 1000;

interface FormErrors {
  subjectId?: string;
  topicId?: string;
  text?: string;
  options: Partial<Record<OptionKey, string>>;
  correct?: string;
  explanation?: string;
}

interface FormValues {
  subjectId: string;
  topicId: string;
  text: string;
  difficulty: Difficulty;
  type: QuestionType;
  options: Record<OptionKey, string>;
  correct: OptionKey[];
  explanation: string;
  reference: string;
}

const emptyValues: FormValues = {
  subjectId: "",
  topicId: "",
  text: "",
  difficulty: "medium",
  type: "single",
  options: { A: "", B: "", C: "", D: "" },
  correct: [],
  explanation: "",
  reference: "",
};

// A draft only needs the question text. A published question must be complete.
function validate(values: FormValues, mode: QuestionStatus): FormErrors {
  const errors: FormErrors = { options: {} };

  if (!values.text.trim()) errors.text = "Write the question text.";
  if (mode === "draft") return errors;

  if (!values.subjectId) errors.subjectId = "Choose a subject.";
  if (!values.topicId) errors.topicId = "Choose a topic.";
  for (const key of OPTION_KEYS) {
    if (!values.options[key].trim()) errors.options[key] = `Write option ${key}.`;
  }
  if (values.correct.length === 0) errors.correct = "Mark the correct answer.";
  else if (values.type === "multiple" && values.correct.length < 2) errors.correct = "A multiple correct question needs at least two correct options.";
  if (!values.explanation.trim()) errors.explanation = "Write the explanation students will see.";
  return errors;
}

const hasErrors = (errors: FormErrors) =>
  Object.entries(errors).some(([key, value]) => (key === "options" ? Object.keys(value).length > 0 : Boolean(value)));

interface QuestionFormProps {
  // The question being edited. Leave out to add a new one.
  question?: Question;
}

export function QuestionForm({ question }: QuestionFormProps) {
  const router = useRouter();
  const toast = useToast();
  const { questions, subjects, topics } = useAdminStore();

  const [values, setValues] = useState<FormValues>(
    question
      ? {
          subjectId: question.subjectId,
          topicId: question.topicId,
          text: question.text,
          difficulty: question.difficulty,
          type: question.type,
          options: { ...question.options },
          correct: [...question.correct],
          explanation: question.explanation,
          reference: question.reference,
        }
      : emptyValues,
  );
  const [image, setImage] = useState<ChosenImage | null>(
    question?.imageName ? { name: question.imageName, previewUrl: null } : null,
  );
  const [imageError, setImageError] = useState<string>();
  const [errors, setErrors] = useState<FormErrors>({ options: {} });

  const topicOptions = topics.items.filter((topic) => topic.subjectId === values.subjectId);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function changeType(type: QuestionType) {
    // Going back to "single" keeps only the first chosen answer
    setValues((prev) => ({ ...prev, type, correct: type === "single" ? prev.correct.slice(0, 1) : prev.correct }));
  }

  function toggleCorrect(key: OptionKey) {
    setValues((prev) => {
      if (prev.type === "single") return { ...prev, correct: [key] };
      const has = prev.correct.includes(key);
      return { ...prev, correct: (has ? prev.correct.filter((k) => k !== key) : [...prev.correct, key]).sort() };
    });
    setErrors((prev) => ({ ...prev, correct: undefined }));
  }

  function save(mode: QuestionStatus) {
    const found = validate(values, mode);
    setErrors(found);
    if (hasErrors(found)) {
      toast({
        title: mode === "published" ? "Fix the highlighted fields" : "Write the question text first",
        description: "The question was not saved.",
        tone: "error",
      });
      return;
    }

    const record: Question = {
      id: question?.id ?? nextId("q", questions.items.map((q) => q.id)),
      subjectId: values.subjectId,
      topicId: values.topicId,
      text: values.text.trim(),
      difficulty: values.difficulty,
      type: values.type,
      options: { A: values.options.A.trim(), B: values.options.B.trim(), C: values.options.C.trim(), D: values.options.D.trim() },
      correct: values.correct,
      explanation: values.explanation.trim(),
      reference: values.reference.trim(),
      imageName: image?.name ?? "",
      status: mode === "published" ? "published" : "draft",
      createdAt: question?.createdAt ?? todayIso(),
    };

    if (question) questions.update(question.id, record);
    else questions.add(record);

    toast({
      title: mode === "published" ? "Question published" : "Draft saved",
      description: `${record.id} was saved (demo data).`,
    });
    router.push("/questions");
  }

  const editing = question !== undefined;

  return (
    <>
      <Link href="/questions" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to question bank
      </Link>
      <PageHeader
        title={editing ? "Edit question" : "Add question"}
        description={editing ? `Editing ${question.id}` : "Write the question, its four options and the explanation."}
      />

      <form onSubmit={(event) => event.preventDefault()} noValidate>
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-6">
            <Card>
              <CardHeader title="Question" description="What students will read" />
              <CardContent className="space-y-5">
                <div>
                  <TextAreaField
                    label="Question text"
                    required
                    rows={5}
                    maxLength={TEXT_LIMIT}
                    value={values.text}
                    onChange={(e) => {
                      set("text", e.target.value);
                      setErrors((prev) => ({ ...prev, text: undefined }));
                    }}
                    error={errors.text}
                    placeholder="Write the question here…"
                  />
                  <p className="mt-1 text-right text-xs text-slate-400">
                    {values.text.length}/{TEXT_LIMIT}
                  </p>
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-medium text-slate-700">Question image</p>
                  <ImageUpload value={image} onChange={setImage} error={imageError} onError={setImageError} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title="Options and correct answer"
                description={values.type === "single" ? "Select one correct option." : "Select every correct option (at least two)."}
              />
              <CardContent className="space-y-4">
                {OPTION_KEYS.map((key) => {
                  const correct = values.correct.includes(key);
                  return (
                    <div
                      key={key}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-3 transition-colors",
                        correct ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200",
                      )}
                    >
                      <span className="mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-600">
                        {key}
                      </span>
                      <div className="min-w-0 flex-1">
                        <TextField
                          label={`Option ${key}`}
                          required
                          value={values.options[key]}
                          onChange={(e) => {
                            setValues((prev) => ({ ...prev, options: { ...prev.options, [key]: e.target.value } }));
                            setErrors((prev) => ({ ...prev, options: { ...prev.options, [key]: undefined } }));
                          }}
                          error={errors.options[key]}
                          placeholder={`Text for option ${key}`}
                        />
                      </div>
                      <div className="mt-8 shrink-0">
                        <Checkbox
                          kind={values.type === "single" ? "radio" : "checkbox"}
                          name="correct-answer"
                          label="Correct"
                          checked={correct}
                          onChange={() => toggleCorrect(key)}
                        />
                      </div>
                    </div>
                  );
                })}
                {errors.correct ? (
                  <p role="alert" className="text-xs font-medium text-red-600">
                    {errors.correct}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Explanation" description="Shown to students after they answer" />
              <CardContent className="space-y-5">
                <TextAreaField
                  label="Detailed explanation"
                  required
                  rows={5}
                  value={values.explanation}
                  onChange={(e) => {
                    set("explanation", e.target.value);
                    setErrors((prev) => ({ ...prev, explanation: undefined }));
                  }}
                  error={errors.explanation}
                  placeholder="Explain why the correct option is right and the others are wrong…"
                />
                <TextField
                  label="Reference / source"
                  value={values.reference}
                  onChange={(e) => set("reference", e.target.value)}
                  placeholder="e.g. Textbook name, chapter and page"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <Card>
              <CardHeader title="Classification" />
              <CardContent className="space-y-5">
                <SelectField
                  label="Subject"
                  required
                  value={values.subjectId}
                  onChange={(e) => {
                    // A topic belongs to one subject, so changing the subject clears the topic
                    setValues((prev) => ({ ...prev, subjectId: e.target.value, topicId: "" }));
                    setErrors((prev) => ({ ...prev, subjectId: undefined }));
                  }}
                  error={errors.subjectId}
                >
                  <option value="">Choose a subject</option>
                  {subjects.items.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="Topic"
                  required
                  value={values.topicId}
                  disabled={!values.subjectId}
                  onChange={(e) => {
                    set("topicId", e.target.value);
                    setErrors((prev) => ({ ...prev, topicId: undefined }));
                  }}
                  error={errors.topicId}
                  hint={values.subjectId ? undefined : "Choose a subject first."}
                >
                  <option value="">Choose a topic</option>
                  {topicOptions.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </SelectField>

                <div>
                  <p className="mb-1.5 text-sm font-medium text-slate-700" id="difficulty-label">
                    Difficulty
                  </p>
                  <Segmented
                    ariaLabel="Difficulty"
                    value={values.difficulty}
                    onChange={(value) => set("difficulty", value)}
                    options={[
                      { value: "easy", label: "Easy" },
                      { value: "medium", label: "Medium" },
                      { value: "hard", label: "Hard" },
                    ]}
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-medium text-slate-700">Question type</p>
                  <Segmented
                    ariaLabel="Question type"
                    value={values.type}
                    onChange={changeType}
                    options={[
                      { value: "single", label: "Single correct" },
                      { value: "multiple", label: "Multiple correct" },
                    ]}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-500">
                  {editing && question.status === "published"
                    ? "This question is published. Saving as a draft will hide it from students."
                    : "Save a draft to finish later, or publish when the question is complete."}
                </p>
                <Button className="w-full" leftIcon={<Send className="h-4 w-4" />} onClick={() => save("published")}>
                  Publish question
                </Button>
                <Button className="w-full" variant="outline" leftIcon={<Save className="h-4 w-4" />} onClick={() => save("draft")}>
                  Save draft
                </Button>
                <Link href="/questions" className={buttonStyles({ variant: "ghost", className: "w-full" })}>
                  Cancel
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </>
  );
}
