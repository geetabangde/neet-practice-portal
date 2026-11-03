import { SelectField, TextAreaField, TextField } from "@/components/ui/form-controls";
import type { StepProps } from "./test-form-types";

export function StepBasics({ values, errors, update }: StepProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <TextField
        label="Test title"
        required
        value={values.title}
        onChange={(e) => update({ title: e.target.value })}
        error={errors.title}
        placeholder="e.g. Grand Test 6 - NEET Pattern"
        wrapperClassName="sm:col-span-2"
      />
      <TextAreaField
        label="Description"
        rows={3}
        value={values.description}
        onChange={(e) => update({ description: e.target.value })}
        placeholder="What the test covers, and any instructions for students"
        wrapperClassName="sm:col-span-2"
      />
      <TextField
        label="Duration (minutes)"
        required
        type="number"
        min={1}
        value={values.durationMinutes}
        onChange={(e) => update({ durationMinutes: e.target.value })}
        error={errors.durationMinutes}
      />
      <TextField
        label="Marks per question"
        required
        type="number"
        min={1}
        value={values.marksPerQuestion}
        onChange={(e) => update({ marksPerQuestion: e.target.value })}
        error={errors.marksPerQuestion}
        hint="Total marks = marks per question × number of questions."
      />
      <SelectField
        label="Negative marking"
        value={values.negativeMarking}
        onChange={(e) => update({ negativeMarking: e.target.value })}
        hint="Marks removed for each wrong answer."
      >
        <option value="0">No negative marking</option>
        <option value="0.25">0.25 per wrong answer</option>
        <option value="0.33">0.33 per wrong answer</option>
        <option value="0.5">0.5 per wrong answer</option>
        <option value="1">1 per wrong answer</option>
      </SelectField>
      <div className="hidden sm:block" />
      <TextField
        label="Start date and time"
        required
        type="datetime-local"
        value={values.startAt}
        onChange={(e) => update({ startAt: e.target.value })}
        error={errors.startAt}
      />
      <TextField
        label="End date and time"
        required
        type="datetime-local"
        value={values.endAt}
        onChange={(e) => update({ endAt: e.target.value })}
        error={errors.endAt}
      />
    </div>
  );
}
