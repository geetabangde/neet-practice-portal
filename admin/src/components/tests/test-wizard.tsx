"use client";

import { ArrowLeft, ArrowRight, Save, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Stepper } from "@/components/ui/stepper";
import { nextId } from "@/lib/ids";
import type { MockTest, TestStatus } from "@/types";
import { StepBasics } from "./step-basics";
import { StepQuestions } from "./step-questions";
import { StepReview } from "./step-review";
import { StepScope } from "./step-scope";
import {
  emptyTestForm,
  formFromTest,
  STEPS,
  validateStep,
  type TestFormErrors,
  type TestFormValues,
} from "./test-form-types";

interface TestWizardProps {
  // The test being edited. Leave out to create a new one.
  test?: MockTest;
}

// Create / edit a test in four steps. Each step is checked before the next one opens.
export function TestWizard({ test }: TestWizardProps) {
  const router = useRouter();
  const toast = useToast();
  const { tests } = useAdminStore();

  const [step, setStep] = useState(0);
  const [values, setValues] = useState<TestFormValues>(test ? formFromTest(test) : emptyTestForm);
  const [errors, setErrors] = useState<TestFormErrors>({});

  const editing = test !== undefined;
  const last = step === STEPS.length - 1;

  function update(patch: Partial<TestFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }));
    // A change clears the messages of the fields it touches
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(patch) as (keyof TestFormValues)[]) {
        delete next[key as keyof TestFormErrors];
      }
      if ("subjectIds" in patch || "topicIds" in patch) delete next.scope;
      if ("questionIds" in patch) delete next.questions;
      return next;
    });
  }

  function next() {
    const found = validateStep(step, values);
    setErrors(found);
    if (Object.keys(found).length === 0) setStep((value) => value + 1);
  }

  function save(status: TestStatus) {
    const record: MockTest = {
      id: test?.id ?? nextId("t", tests.items.map((t) => t.id)),
      title: values.title.trim(),
      description: values.description.trim(),
      subjectIds: values.subjectIds,
      topicIds: values.topicIds,
      questionIds: values.questionIds,
      durationMinutes: Number(values.durationMinutes),
      marksPerQuestion: Number(values.marksPerQuestion),
      negativeMarking: Number(values.negativeMarking),
      startAt: values.startAt,
      endAt: values.endAt,
      status,
    };

    if (test) tests.update(test.id, record);
    else tests.add(record);

    toast({
      title: status === "published" ? "Test published" : status === "draft" ? "Draft saved" : "Test saved",
      description: `${record.title} was saved (demo data).`,
    });
    router.push("/tests");
  }

  return (
    <>
      <Link href="/tests" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to tests
      </Link>
      <PageHeader
        title={editing ? "Edit test" : "Create test"}
        description={editing ? `Editing ${test.id}` : "Set up the basics, choose what it covers, pick the questions, then review."}
      />

      <Card>
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <Stepper steps={STEPS} current={step} />
        </div>
        <CardContent className="sm:p-6">
          <h2 className="mb-5 text-base font-semibold text-slate-900">
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </h2>
          {step === 0 ? <StepBasics values={values} errors={errors} update={update} /> : null}
          {step === 1 ? <StepScope values={values} errors={errors} update={update} /> : null}
          {step === 2 ? <StepQuestions values={values} errors={errors} update={update} /> : null}
          {step === 3 ? <StepReview values={values} /> : null}
        </CardContent>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
          <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setStep((v) => v - 1)} disabled={step === 0}>
            Back
          </Button>

          {last ? (
            <div className="flex flex-wrap items-center gap-2">
              {test?.status === "completed" ? (
                <Button leftIcon={<Save className="h-4 w-4" />} onClick={() => save("completed")}>
                  Save changes
                </Button>
              ) : (
                <>
                  <Button variant="outline" leftIcon={<Save className="h-4 w-4" />} onClick={() => save("draft")}>
                    Save as draft
                  </Button>
                  <Button leftIcon={<Send className="h-4 w-4" />} onClick={() => save("published")}>
                    {test?.status === "published" ? "Save and keep published" : "Publish test"}
                  </Button>
                </>
              )}
            </div>
          ) : (
            <Button rightIcon={<ArrowRight className="h-4 w-4" />} onClick={next}>
              Next
            </Button>
          )}
        </div>
      </Card>
    </>
  );
}
