"use client";

import { useEffect, useRef } from "react";

// Opens and closes a native <dialog> to match `open`. A native dialog gives focus trapping
// and the Esc key for free. The cleanup closes it again when the page is left, so a modal
// can never stay open in the background and block the next page.
export function useDialog(open: boolean) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  return ref;
}
