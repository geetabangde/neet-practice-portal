"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Bold, Columns3, Italic, Link2, List, ListOrdered, Redo2, Rows3, Subscript as SubscriptIcon, Superscript as SuperscriptIcon, Table2, Trash2, Underline, Undo2 } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { toEditorHtml } from "@/lib/rich-text";

interface RichTextEditorProps {
  label: string;
  value: string;
  onChange: (html: string) => void;
  // The short bar (bold, italic, underline, sub/superscript): for the options. The full bar adds lists, links and tables.
  compact?: boolean;
  placeholder?: string;
  error?: string;
  required?: boolean;
  hint?: string;
  // Hide the visible label (the editor still has it for screen readers)
  hideLabel?: boolean;
  minHeightClass?: string;
}

function ToolButton({ label, active = false, disabled = false, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // Keeps the cursor in the text when a button is pressed
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40",
        active && "bg-indigo-100 text-indigo-700",
      )}
    >
      {children}
    </button>
  );
}

const Divider = () => <span className="mx-1 h-5 w-px bg-slate-300" aria-hidden="true" />;

function Toolbar({ editor, compact }: { editor: Editor; compact: boolean }) {
  const icon = "h-4 w-4";
  const inTable = editor.isActive("table");

  function setLink() {
    const previous = (editor.getAttributes("link").href as string | undefined) ?? "https://";
    const address = window.prompt("Link address (starting with https://). Leave it empty to remove the link.", previous);
    if (address === null) return;
    if (address.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: address.trim() }).run();
  }

  return (
    <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-1.5 py-1">
      <ToolButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className={icon} aria-hidden="true" />
      </ToolButton>
      <ToolButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className={icon} aria-hidden="true" />
      </ToolButton>
      <ToolButton label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <Underline className={icon} aria-hidden="true" />
      </ToolButton>
      <ToolButton label="Subscript" active={editor.isActive("subscript")} onClick={() => editor.chain().focus().toggleSubscript().run()}>
        <SubscriptIcon className={icon} aria-hidden="true" />
      </ToolButton>
      <ToolButton label="Superscript" active={editor.isActive("superscript")} onClick={() => editor.chain().focus().toggleSuperscript().run()}>
        <SuperscriptIcon className={icon} aria-hidden="true" />
      </ToolButton>
      {compact ? null : (
        <>
          <Divider />
          <ToolButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List className={icon} aria-hidden="true" />
          </ToolButton>
          <ToolButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className={icon} aria-hidden="true" />
          </ToolButton>
          <ToolButton label="Link" active={editor.isActive("link")} onClick={setLink}>
            <Link2 className={icon} aria-hidden="true" />
          </ToolButton>
          <Divider />
          <ToolButton label="Insert a table" disabled={inTable} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run()}>
            <Table2 className={icon} aria-hidden="true" />
          </ToolButton>
          {inTable ? (
            <>
              <ToolButton label="Add a row below" onClick={() => editor.chain().focus().addRowAfter().run()}>
                <Rows3 className={icon} aria-hidden="true" />
              </ToolButton>
              <ToolButton label="Add a column after" onClick={() => editor.chain().focus().addColumnAfter().run()}>
                <Columns3 className={icon} aria-hidden="true" />
              </ToolButton>
              <ToolButton label="Delete the row" onClick={() => editor.chain().focus().deleteRow().run()}>
                <span className="text-[10px] font-bold">−R</span>
              </ToolButton>
              <ToolButton label="Delete the column" onClick={() => editor.chain().focus().deleteColumn().run()}>
                <span className="text-[10px] font-bold">−C</span>
              </ToolButton>
              <ToolButton label="Delete the table" onClick={() => editor.chain().focus().deleteTable().run()}>
                <Trash2 className={cn(icon, "text-red-600")} aria-hidden="true" />
              </ToolButton>
            </>
          ) : null}
        </>
      )}
      <Divider />
      <ToolButton label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 className={icon} aria-hidden="true" />
      </ToolButton>
      <ToolButton label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 className={icon} aria-hidden="true" />
      </ToolButton>
    </div>
  );
}

// A text box with a formatting bar (bold, italic, lists, tables ...). It gives back HTML, or "" when nothing is written.
// Text that is plain (older questions) is shown in it as paragraphs.
export function RichTextEditor({ label, value, onChange, compact = false, placeholder, error, required, hint, hideLabel = false, minHeightClass }: RichTextEditorProps) {
  const id = useId();
  // The last value this editor handed out, so that a change that comes from outside (a cleared form) can be told apart
  const lastEmitted = useRef(value);

  const editor = useEditor({
    // Next renders on the server first: the editor must wait for the browser
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [3] },
        link: { openOnClick: false, autolink: false, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } },
        // The server keeps only formatting it knows: no code blocks, rules or strikethrough
        codeBlock: false,
        code: false,
        horizontalRule: false,
        strike: false,
      }),
      Subscript,
      Superscript,
      TableKit.configure({ table: { resizable: false } }),
    ],
    content: toEditorHtml(value),
    editorProps: {
      attributes: {
        id,
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": label,
        ...(error ? { "aria-invalid": "true" } : {}),
        class: cn("rich-content px-3 py-2.5 text-sm text-slate-900", minHeightClass ?? (compact ? "min-h-[2.75rem]" : "min-h-[9rem]")),
      },
    },
    onUpdate: ({ editor: current }) => {
      const html = current.isEmpty ? "" : current.getHTML();
      lastEmitted.current = html;
      onChange(html);
    },
  });

  // The placeholder shows while the editor is empty
  useEffect(() => {
    if (!editor || !placeholder) return;
    editor.view.dom.setAttribute("data-placeholder", placeholder);
  }, [editor, placeholder]);

  // The form was cleared or filled from outside: show the new value
  useEffect(() => {
    if (!editor || value === lastEmitted.current) return;
    lastEmitted.current = value;
    editor.commands.setContent(toEditorHtml(value), { emitUpdate: false });
  }, [editor, value]);

  return (
    <div>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "mb-1.5 block text-sm font-medium text-slate-700"}>
        {label}
        {required ? (
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      <div
        className={cn(
          "rich-editor overflow-hidden rounded-lg border bg-white transition focus-within:ring-4",
          error ? "border-red-400 focus-within:border-red-500 focus-within:ring-red-100" : "border-slate-300 focus-within:border-indigo-500 focus-within:ring-indigo-100",
        )}
      >
        {editor ? <Toolbar editor={editor} compact={compact} /> : <div className="h-[37px] border-b border-slate-200 bg-slate-50" aria-hidden="true" />}
        <EditorContent editor={editor} />
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
