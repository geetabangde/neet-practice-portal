// The explanation and the options of a question may be written in the editor: then the saved text is HTML.
// Older questions and imported ones are plain text. These helpers let every screen handle both.

// True when the text holds HTML tags (a "<" followed by a tag name). "x < y" is not HTML.
export const looksLikeHtml = (value: string): boolean => /<\/?[a-z][a-z0-9]*(\s[^>]*)?>/i.test(value);

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// What the editor starts with: HTML as it is, plain text turned into paragraphs (a line break starts a new one)
export function toEditorHtml(value: string): string {
  if (value.trim() === "") return "";
  if (looksLikeHtml(value)) return value;
  return value
    .split(/\r?\n/)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

// The words of the text without tags, for length checks and short previews
export function plainText(value: string): string {
  if (!looksLikeHtml(value)) return value.trim();
  if (typeof document === "undefined") return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const holder = document.createElement("div");
  holder.innerHTML = value;
  return (holder.textContent ?? "").replace(/\s+/g, " ").trim();
}
