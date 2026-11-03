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
    // Also close when the page is left or hidden. Next keeps the previous page alive, and a modal
    // that stays open there would keep blocking (freezing) the next page.
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  return ref;
}
