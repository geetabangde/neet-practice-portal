import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

interface StepperProps {
  steps: string[];
  // Index of the step the user is on
  current: number;
}

// Shows the steps of a wizard: done steps get a tick, the current one is highlighted
export function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="flex items-center" aria-label="Progress">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={step}
            aria-current={active ? "step" : undefined}
            className={cn("flex items-center", index < steps.length - 1 && "flex-1")}
          >
            <span className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1 ring-inset",
                  done && "bg-indigo-600 text-white ring-indigo-600",
                  active && "bg-indigo-50 text-indigo-700 ring-indigo-600",
                  !done && !active && "bg-white text-slate-400 ring-slate-300",
                )}
              >
                {done ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:inline",
                  active ? "text-slate-900" : done ? "text-slate-700" : "text-slate-400",
                )}
              >
                {step}
              </span>
            </span>
            {index < steps.length - 1 ? (
              <span
                aria-hidden="true"
                className={cn("mx-3 h-px flex-1", done ? "bg-indigo-600" : "bg-slate-200")}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
