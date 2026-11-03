import type { ReactNode } from "react";
import { ChevronDownIcon } from "./icons";

type InstructionAccordionProps = {
  title: string;
  children: ReactNode;
};

// Native <details>: opens and closes without any JavaScript, and works with the keyboard
export default function InstructionAccordion({ title, children }: InstructionAccordionProps) {
  return (
    <details open className="group mt-4 overflow-hidden rounded-lg bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between bg-[#dcf2f7] px-4 py-3 text-sm font-semibold marker:hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDownIcon className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </details>
  );
}
