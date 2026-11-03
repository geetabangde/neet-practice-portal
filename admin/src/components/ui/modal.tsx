"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useDialog } from "@/hooks/use-dialog";
import { cn } from "@/lib/cn";

type ModalSize = "sm" | "md" | "lg" | "xl";

const sizes: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: ModalSize;
  // Buttons at the bottom, e.g. Cancel and Save
  footer?: ReactNode;
  children: ReactNode;
}

// A pop-up window built on the native <dialog> element: it traps the keyboard focus,
// closes with Esc, and the page behind it cannot be clicked.
export function Modal({ open, onClose, title, description, size = "md", footer, children }: ModalProps) {
  const ref = useDialog(open);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // A click on the dark backdrop lands on the <dialog> element itself
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      aria-label={title}
      className={cn(
        "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-hidden rounded-2xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/50 backdrop:backdrop-blur-[2px]",
        sizes[size],
      )}
    >
      {/* Only mounted while open, so the form inside starts fresh every time */}
      {open ? (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
              {description ? <p className="mt-0.5 text-sm text-slate-500">{description}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer ? (
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              {footer}
            </div>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
