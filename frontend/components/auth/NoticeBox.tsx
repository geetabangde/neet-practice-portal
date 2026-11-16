import type { Notice } from "./useOtpNotice";

// The message under a login or signup form. The wrapper stays on the page, so screen readers
// announce the text when it changes.
export default function NoticeBox({ notice }: { notice: Notice | null }) {
  return (
    <div role="status" aria-live="polite">
      {notice ? (
        <p
          className={`mt-4 rounded-lg p-3 text-xs ${
            notice.tone === "error" ? "bg-rose-50 text-rose-700" : "bg-accent-soft text-brand-950"
          }`}
        >
          {notice.text}
        </p>
      ) : null}
    </div>
  );
}
