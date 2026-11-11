"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Bold, Code2, Heading2, Heading3, Italic, Link2, List, ListOrdered, Pilcrow, Quote, Redo2, Undo2 } from "lucide-react";
import { monoCls } from "@/components/dashboard/admin-ui";
import { toEditorHtml } from "@/lib/rich-text";

type Props = {
  /** Stored content: HTML, or older plain text (converted to paragraphs on load). */
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
};

const ToolButton = ({ onClick, active, label, children, disabled }: { onClick: () => void; active?: boolean; label: string; children: React.ReactNode; disabled?: boolean }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    disabled={disabled}
    title={label}
    aria-label={label}
    aria-pressed={active}
    className={`flex h-8 w-8 items-center justify-center rounded transition disabled:opacity-30 ${
      active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`}
  >
    {children}
  </button>
);

function Toolbar({ editor, htmlMode, onToggleHtml }: { editor: Editor | null; htmlMode: boolean; onToggleHtml: () => void }) {
  const disabled = !editor || htmlMode;
  function setLink() {
    if (!editor) return;
    const prev = (editor.getAttributes("link").href as string | undefined) ?? "";
    const url = window.prompt("Link address (leave empty to remove the link)", prev || "https://");
    if (url === null) return;
    if (!url.trim()) editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
      <ToolButton label="Paragraph" disabled={disabled} active={editor?.isActive("paragraph")} onClick={() => editor?.chain().focus().setParagraph().run()}>
        <Pilcrow size={15} />
      </ToolButton>
      <ToolButton label="Heading" disabled={disabled} active={editor?.isActive("heading", { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 size={16} />
      </ToolButton>
      <ToolButton label="Subheading" disabled={disabled} active={editor?.isActive("heading", { level: 3 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3 size={16} />
      </ToolButton>
      <span className="mx-1 h-5 w-px bg-slate-200" />
      <ToolButton label="Bold" disabled={disabled} active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()}>
        <Bold size={15} />
      </ToolButton>
      <ToolButton label="Italic" disabled={disabled} active={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()}>
        <Italic size={15} />
      </ToolButton>
      <ToolButton label="Link" disabled={disabled} active={editor?.isActive("link")} onClick={setLink}>
        <Link2 size={15} />
      </ToolButton>
      <span className="mx-1 h-5 w-px bg-slate-200" />
      <ToolButton label="Bullet list" disabled={disabled} active={editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
        <List size={16} />
      </ToolButton>
      <ToolButton label="Numbered list" disabled={disabled} active={editor?.isActive("orderedList")} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
        <ListOrdered size={16} />
      </ToolButton>
      <ToolButton label="Quote" disabled={disabled} active={editor?.isActive("blockquote")} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
        <Quote size={15} />
      </ToolButton>
      <span className="mx-1 h-5 w-px bg-slate-200" />
      <ToolButton label="Undo" disabled={disabled || !editor?.can().undo()} onClick={() => editor?.chain().focus().undo().run()}>
        <Undo2 size={15} />
      </ToolButton>
      <ToolButton label="Redo" disabled={disabled || !editor?.can().redo()} onClick={() => editor?.chain().focus().redo().run()}>
        <Redo2 size={15} />
      </ToolButton>
      <button
        type="button"
        onClick={onToggleHtml}
        className={`ml-auto inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-xs font-semibold transition ${
          htmlMode ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
        }`}
        aria-pressed={htmlMode}
      >
        <Code2 size={14} aria-hidden="true" /> HTML
      </button>
    </div>
  );
}

/**
 * Word-processor style editor (TipTap). Emits HTML. The "HTML" toggle shows the raw
 * markup for advanced edits. Content is normalised once on load (plain text → paragraphs).
 */
export default function RichTextEditor({ value, onChange, placeholder, minHeight = 280 }: Props) {
  const [htmlMode, setHtmlMode] = useState(false);
  const [html, setHtml] = useState(() => toEditorHtml(value));
  const lastEmitted = useRef<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener" } }),
    ],
    content: html,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none px-4 py-3 focus:outline-none prose-headings:font-display prose-headings:text-slate-900 prose-a:text-accent",
        style: `min-height:${minHeight}px`,
        ...(placeholder ? { "aria-label": placeholder } : {}),
      },
    },
    onUpdate: ({ editor: ed }) => {
      const next = ed.isEmpty ? "" : ed.getHTML();
      lastEmitted.current = next;
      setHtml(next);
      onChange(next);
    },
  });

  // Load new content when a different item is opened (value changed from outside).
  useEffect(() => {
    if (value === lastEmitted.current) return;
    const next = toEditorHtml(value);
    lastEmitted.current = value;
    setHtml(next);
    if (editor && editor.getHTML() !== next) editor.commands.setContent(next || "", false);
  }, [value, editor]);

  function toggleHtml() {
    if (htmlMode && editor) {
      editor.commands.setContent(html || "", false);
    }
    setHtmlMode((m) => !m);
  }

  return (
    <div className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
      <Toolbar editor={editor} htmlMode={htmlMode} onToggleHtml={toggleHtml} />
      {htmlMode ? (
        <textarea
          value={html}
          onChange={(e) => {
            setHtml(e.target.value);
            lastEmitted.current = e.target.value;
            onChange(e.target.value);
          }}
          spellCheck={false}
          className={`${monoCls} rounded-none border-0 shadow-none focus:ring-0`}
          style={{ minHeight }}
          aria-label="HTML source"
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
}
