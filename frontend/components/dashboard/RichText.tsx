// The explanation and the options of a question are written in the admin panel's editor: bold, italic, lists, tables ...
// They arrive as HTML that the server has already cleaned. Older questions are plain text: that is shown as text, with its line breaks.

// True when the text holds HTML tags (a "<" followed by a tag name). "x < y" is not HTML.
const looksLikeHtml = (value: string): boolean => /<\/?[a-z][a-z0-9]*(\s[^>]*)?>/i.test(value);

type RichTextProps = {
  value: string;
  className?: string;
  // "inline" keeps the first paragraph on the line of what comes before it (the letter of an option)
  inline?: boolean;
};

export default function RichText({ value, className = "", inline = false }: RichTextProps) {
  if (!looksLikeHtml(value)) return <span className={`whitespace-pre-line ${className}`}>{value}</span>;
  // A span, because an option sits inside a button, which can only hold inline content
  return <span className={`rich-content ${inline ? "rich-inline" : "rich-block"} ${className}`} dangerouslySetInnerHTML={{ __html: value }} />;
}
