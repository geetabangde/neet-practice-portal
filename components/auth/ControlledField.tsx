"use client";

import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import Field, { type FieldProps } from "./Field";

// Everything Field needs except the three props React Hook Form supplies
type ControlledFieldProps<T extends FieldValues> = Omit<FieldProps, "value" | "onChange" | "error"> & {
  control: Control<T>;
  name: FieldPath<T>;
};

// Connects one form field to Field: value and onChange come from React Hook
// Form, and the error message comes from the schema's validation result.
export default function ControlledField<T extends FieldValues>({
  control,
  name,
  ...fieldProps
}: ControlledFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field
          {...fieldProps}
          value={String(field.value ?? "")}
          onChange={field.onChange}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
