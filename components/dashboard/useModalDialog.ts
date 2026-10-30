import { useEffect, useRef } from "react";

// Opens and closes a native <dialog> to match `open`. A native dialog gives
// focus trapping and the Esc key for free.
export function useModalDialog(open: boolean) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return ref;
}
