import type { RowDataPacket } from "mysql2/promise";
import sanitizeHtml from "sanitize-html";
import { pool } from "../config/db";

// The explanation and the four options of a question can be written in the admin panel's editor (bold, lists, tables ...).
// What is stored is then HTML, cleaned here so that nothing but plain formatting can get in. Older questions and imported
// ones are plain text: that stays as it is, and the screens show it as text.

// True when the text holds HTML tags (a "<" followed by a tag name). "x < y" is not HTML.
export const looksLikeHtml = (value: string): boolean => /<\/?[a-z][a-z0-9]*(\s[^>]*)?>/i.test(value);

const ALLOWED: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "s", "sub", "sup", "ul", "ol", "li", "h3", "h4", "blockquote", "hr", "table", "thead", "tbody", "tfoot", "tr", "th", "td", "a"],
  allowedAttributes: { a: ["href", "target", "rel"], th: ["colspan", "rowspan"], td: ["colspan", "rowspan"] },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }) },
};

// The words of a piece of text or HTML, without tags
export function plainText(value: string): string {
  const stripped = looksLikeHtml(value) ? sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }) : value;
  return stripped.replace(/&[a-z0-9#]+;/gi, "x").trim();
}

// How long the text looks to a reader: tags are not counted
export const plainLength = (value: string): number => plainText(value).length;

// Plain text is kept as it is (trimmed). HTML is cleaned to the allowed tags; an editor that holds nothing ("<p></p>") becomes "".
export function cleanRich(value: string): string {
  const trimmed = value.trim();
  if (!looksLikeHtml(trimmed)) return trimmed;
  const clean = sanitizeHtml(trimmed, ALLOWED).trim();
  return plainText(clean) === "" && !/<table[\s>]/i.test(clean) ? "" : clean;
}

// The option columns used to be VARCHAR(500), too small for HTML. This makes them TEXT in both question tables.
// It does nothing when they already are. Safe to run again.
export async function migrateOptionColumns(): Promise<number> {
  let changed = 0;
  for (const table of ["questions", "test_series_questions"]) {
    const [rows] = await pool.query<(RowDataPacket & { type: string })[]>(
      "SELECT DATA_TYPE AS type FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'option_a'",
      [table],
    );
    if (rows.length === 0 || rows[0].type.toLowerCase() === "text") continue;
    await pool.query(`ALTER TABLE ${table} MODIFY option_a TEXT NOT NULL, MODIFY option_b TEXT NOT NULL, MODIFY option_c TEXT NOT NULL, MODIFY option_d TEXT NOT NULL`);
    changed += 1;
  }
  return changed;
}
