"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useDismiss } from "@/hooks/use-dismiss";
import { cn } from "@/lib/cn";

const DropdownContext = createContext<{ close: () => void } | null>(null);

interface DropdownProps {
  // What the button shows (an icon, a name, ...)
  label: ReactNode;
  // Describes the button for screen readers, e.g. "Row actions"
  ariaLabel: string;
  align?: "left" | "right";
  buttonClassName?: string;
  panelClassName?: string;
  children: ReactNode;
}

// A button that opens a small menu. It closes on outside click, Escape, or after a choice.
export function Dropdown({
  label,
  ariaLabel,
  align = "right",
  buttonClassName,
  panelClassName,
  children,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const context = useMemo(() => ({ close }), [close]);

  useDismiss(ref, open, close);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((value) => !value)}
        className={buttonClassName}
      >
        {label}
      </button>
      {open ? (
        <DropdownContext.Provider value={context}>
          <div
            role="menu"
            className={cn(
              "absolute z-40 mt-2 min-w-48 origin-top rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg",
              align === "right" ? "right-0" : "left-0",
              panelClassName,
            )}
          >
            {children}
          </div>
        </DropdownContext.Provider>
      ) : null}
    </div>
  );
}

const itemStyles =
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

function itemTone(danger?: boolean) {
  return danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-100";
}

function useClose() {
  const context = useContext(DropdownContext);
  return context ? context.close : () => {};
}

interface MenuItemProps {
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
  children: ReactNode;
}

export function MenuItem({ icon, onClick, danger, children }: MenuItemProps) {
  const close = useClose();
  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        close();
        onClick();
      }}
      className={cn(itemStyles, itemTone(danger))}
    >
      {icon}
      {children}
    </button>
  );
}

export function MenuLink({ icon, href, children, onClick }: { icon?: ReactNode; href: string; children: ReactNode; onClick?: () => void }) {
  const closeMenu = useClose();
  const close = () => {
    onClick?.();
    closeMenu();
  };
  // A full address (http...) opens the other site in a new tab; a path stays inside the admin panel
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return (
      <a href={href} target="_blank" rel="noreferrer" role="menuitem" onClick={close} className={cn(itemStyles, itemTone())}>
        {icon}
        {children}
      </a>
    );
  }
  return (
    <Link href={href} role="menuitem" onClick={close} className={cn(itemStyles, itemTone())}>
      {icon}
      {children}
    </Link>
  );
}

export function MenuSeparator() {
  return <div role="separator" className="my-1.5 h-px bg-slate-100" />;
}
