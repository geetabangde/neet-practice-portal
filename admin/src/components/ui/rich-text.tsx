import { cn } from "@/lib/cn";
import { looksLikeHtml } from "@/lib/rich-text";

// Shows an explanation or an option. HTML written in the editor is shown with its formatting (the server has cleaned it);
// plain text is shown as text, with its line breaks.
export function RichText({ value, className }: { value: string; className?: string }) {
  if (!looksLikeHtml(value)) return <span className={cn("whitespace-pre-line", className)}>{value}</span>;
  return <div className={cn("rich-content", className)} dangerouslySetInnerHTML={{ __html: value }} />;
}
