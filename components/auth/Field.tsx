export type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "tel" | "email" | "text";
  // Fixed text shown before the input, e.g. "+91"
  prefix?: string;
  maxLength?: number;
};

export default function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
  prefix,
  maxLength,
}: FieldProps) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-slate-600">
        {label}
      </label>
      <div
        className={`mt-1.5 flex items-center rounded-lg border bg-white focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30 ${
          error ? "border-rose-400" : "border-slate-300"
        }`}
      >
        {prefix ? (
          <span className="border-r border-slate-200 px-3 text-sm text-slate-600">{prefix}</span>
        ) : null}
        <input
          suppressHydrationWarning
          id={id}
          name={id}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder={placeholder}
          maxLength={maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-11 w-full bg-transparent px-3 text-sm text-brand-950 outline-none placeholder:text-slate-400"
        />
      </div>
      {error ? (
        <p id={errorId} className="mt-1 text-xs text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
