"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ArrowLeft, ExternalLink, ImageIcon, Loader2, Plus, Search, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import FAQEditor from "@/components/dashboard/FAQEditor";
import type { PageFAQ } from "@/lib/page-types";

/* ------------------------------------------------------------------ styles */

export const inputCls =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-slate-50";
export const textareaCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";
export const monoCls = `${textareaCls} font-mono text-xs`;

const btnBase =
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50";
export const btnPrimary = `${btnBase} gradient-accent text-accent-foreground shadow-sm hover:opacity-90`;
export const btnSecondary = `${btnBase} border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50`;
export const btnDanger = `${btnBase} border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-600`;
export const btnGhost = `${btnBase} text-slate-600 hover:bg-slate-100`;

/* ---------------------------------------------------------------- helpers */

export function useSaveShortcut(onSave: () => void, enabled = true) {
  const ref = useRef(onSave);
  ref.current = onSave;
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        ref.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}

/** Warn before leaving the browser tab with unsaved edits. */
export function useUnloadWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);
}

export function confirmDiscard(dirty: boolean) {
  return !dirty || window.confirm("You have unsaved changes. Discard them?");
}

/** Managers keep FAQs as JSON strings; FAQEditor works with objects. */
export function faqStringsToItems(faqs: string[]): PageFAQ[] {
  return faqs.map((f) => {
    try {
      const v = JSON.parse(f) as Partial<PageFAQ>;
      return { q: String(v.q ?? ""), a: String(v.a ?? "") };
    } catch {
      return { q: "", a: "" };
    }
  });
}
export function faqItemsToStrings(items: PageFAQ[]): string[] {
  return items.map((f) => JSON.stringify(f, null, 2));
}

/* ------------------------------------------------------------- primitives */

export const Field = ({
  label,
  hint,
  counter,
  children,
  className = "",
}: {
  label: string;
  hint?: ReactNode;
  counter?: { value: number; ideal: [number, number] };
  children: ReactNode;
  className?: string;
}) => {
  let counterTone = "text-slate-400";
  if (counter && counter.value > 0) {
    const [min, max] = counter.ideal;
    counterTone = counter.value > max ? "text-red-600" : counter.value >= min ? "text-emerald-600" : "text-amber-600";
  }
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {counter ? (
          <span className={`text-xs tabular-nums ${counterTone}`}>
            {counter.value} / {counter.ideal[1]}
          </span>
        ) : null}
      </span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs leading-relaxed text-slate-500">{hint}</span> : null}
    </label>
  );
};

export const Card = ({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) => (
  <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div>
        <h3 className="font-display text-lg font-bold leading-tight text-slate-900">{title}</h3>
        {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
      </div>
      {actions}
    </header>
    <div className="space-y-5 p-5">{children}</div>
  </section>
);

export const StatusBadge = ({ published }: { published: boolean }) => (
  <span
    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
      published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
    }`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${published ? "bg-emerald-500" : "bg-amber-500"}`} aria-hidden="true" />
    {published ? "Published" : "Draft"}
  </span>
);

export const Thumb = ({ src, alt = "" }: { src?: string | null; alt?: string }) => (
  <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
    {src ? (
      <img src={src} alt={alt} className="h-full w-full object-contain" loading="lazy" />
    ) : (
      <ImageIcon size={16} className="text-slate-300" aria-hidden="true" />
    )}
  </span>
);

/* ------------------------------------------------------------ list pane */

export const ListPane = ({
  title,
  count,
  search,
  onSearch,
  onNew,
  newLabel,
  extraAction,
  loading,
  emptyText,
  children,
}: {
  title: string;
  count: number;
  search: string;
  onSearch: (v: string) => void;
  onNew?: () => void;
  newLabel?: string;
  extraAction?: ReactNode;
  loading: boolean;
  emptyText: string;
  children: ReactNode;
}) => (
  <aside className="flex max-h-[26rem] flex-col border-b border-slate-200 bg-white lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:max-h-none lg:border-b-0 lg:border-r">
    <div className="space-y-3 border-b border-slate-100 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-xl font-bold text-slate-900">
          {title} <span className="text-sm font-medium text-slate-400">{count}</span>
        </h2>
        <div className="flex items-center gap-2">
          {extraAction}
          {onNew ? (
            <button type="button" onClick={onNew} className={btnPrimary}>
              <Plus size={16} aria-hidden="true" />
              {newLabel ?? "New"}
            </button>
          ) : null}
        </div>
      </div>
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={`Search ${title.toLowerCase()}…`}
          aria-label={`Search ${title.toLowerCase()}`}
          className={`${inputCls} pl-9`}
        />
      </div>
    </div>
    <div className="flex-1 overflow-y-auto p-2">
      {loading ? (
        <div className="flex items-center gap-2 p-4 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Loading…
        </div>
      ) : count === 0 ? (
        <p className="p-4 text-sm text-slate-500">{emptyText}</p>
      ) : (
        <ul className="space-y-1">{children}</ul>
      )}
    </div>
  </aside>
);

export const ListRow = ({
  active,
  onClick,
  title,
  meta,
  thumb,
  published,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  meta: string;
  thumb?: string | null;
  published?: boolean;
}) => (
  <li>
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition ${
        active ? "bg-accent/10 ring-1 ring-accent/30" : "hover:bg-slate-50"
      }`}
    >
      {thumb !== undefined ? <Thumb src={thumb} /> : null}
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-sm font-semibold ${active ? "text-slate-900" : "text-slate-800"}`}>
          {title || "Untitled"}
        </span>
        <span className="block truncate text-xs text-slate-500">{meta}</span>
      </span>
      {published !== undefined ? <StatusBadge published={published} /> : null}
    </button>
  </li>
);

/* ---------------------------------------------------------- editor header */

export const EditorHeader = ({
  kicker,
  title,
  dirty,
  published,
  onPublishedChange,
  viewHref,
  onDelete,
  onSave,
  saving,
  saveLabel,
  onBack,
}: {
  kicker: string;
  title: string;
  dirty: boolean;
  published?: boolean;
  onPublishedChange?: (v: boolean) => void;
  viewHref?: string;
  onDelete?: () => void;
  onSave: () => void;
  saving: boolean;
  saveLabel: string;
  onBack?: () => void;
}) => (
  <div className="sticky top-16 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
    <div className="flex flex-wrap items-center gap-3 px-5 py-3 lg:px-8">
      {onBack ? (
        <button type="button" onClick={onBack} className={`${btnGhost} lg:hidden`} aria-label="Back to list">
          <ArrowLeft size={16} aria-hidden="true" />
        </button>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500">{kicker}</p>
        <div className="flex items-center gap-2">
          <h2 className="truncate font-display text-xl font-bold text-slate-900">{title}</h2>
          {dirty ? (
            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
              Unsaved changes
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onPublishedChange && published !== undefined ? (
          <label className="mr-1 flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <Switch checked={published} onCheckedChange={onPublishedChange} aria-label="Published" />
            {published ? "Published" : "Draft"}
          </label>
        ) : null}
        {viewHref ? (
          <Link href={viewHref} target="_blank" className={btnSecondary}>
            <ExternalLink size={15} aria-hidden="true" /> View
          </Link>
        ) : null}
        {onDelete ? (
          <button type="button" onClick={onDelete} className={btnDanger} aria-label="Delete">
            <Trash2 size={15} aria-hidden="true" /> <span className="hidden sm:inline">Delete</span>
          </button>
        ) : null}
        <button type="button" onClick={onSave} disabled={saving} className={btnPrimary} title="Save (Ctrl/Cmd + S)">
          {saving ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
          {saving ? "Saving…" : saveLabel}
        </button>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------- media */

export const ImageField = ({
  label,
  value,
  onChange,
  onUpload,
  uploading,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onUpload?: (file: File) => void;
  uploading?: boolean;
  hint?: string;
}) => (
  <div>
    <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
    <div className="flex gap-3">
      <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        {value ? (
          <img src={value} alt="" className="h-full w-full object-contain" />
        ) : (
          <ImageIcon size={20} className="text-slate-300" aria-hidden="true" />
        )}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… or /path/to/image.jpg" className={inputCls} aria-label={label} />
        {onUpload ? (
          <label className={`${btnSecondary} cursor-pointer`}>
            {uploading ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Upload size={15} aria-hidden="true" />}
            {uploading ? "Uploading…" : "Upload image"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = "";
              }}
            />
          </label>
        ) : null}
      </div>
    </div>
    {hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
  </div>
);

/* --------------------------------------------------------------- SEO */

export const SeoPreview = ({ title, description, path }: { title: string; description: string; path: string }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
    <p className="mb-2 text-xs font-medium text-slate-500">Google search preview</p>
    <p className="truncate text-xs text-slate-600">www.fotolaminate.com{path}</p>
    <p className="mt-0.5 line-clamp-1 text-lg leading-snug text-[#1a0dab]">{title || "Page title"}</p>
    <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-slate-600">
      {description || "Add a meta description so search results show a useful summary."}
    </p>
  </div>
);

/* ------------------------------------------------------------ FAQs & JSON */

export const FaqField = ({ faqs, onChange, label }: { faqs: string[]; onChange: (faqs: string[]) => void; label?: string }) => (
  <FAQEditor faqs={faqStringsToItems(faqs)} onChange={(items) => onChange(faqItemsToStrings(items))} label={label} />
);

export const JsonListEditor = ({
  items,
  onChange,
  addLabel,
  emptyText,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  addLabel: string;
  emptyText: string;
  placeholder: string;
}) => (
  <div className="space-y-3">
    {items.length === 0 ? (
      <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">{emptyText}</p>
    ) : (
      items.map((item, i) => (
        <div key={i} className="rounded-lg border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <span className="text-xs font-semibold text-slate-500">Schema {i + 1}</span>
            <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-xs font-semibold text-red-600 hover:underline">
              Remove
            </button>
          </div>
          <textarea
            value={item}
            onChange={(e) => onChange(items.map((s, idx) => (idx === i ? e.target.value : s)))}
            rows={6}
            className={`${monoCls} rounded-t-none border-0 shadow-none focus:ring-0`}
            placeholder={placeholder}
          />
        </div>
      ))
    )}
    <button type="button" onClick={() => onChange([...items, "{"])} className={btnSecondary}>
      <Plus size={15} aria-hidden="true" /> {addLabel}
    </button>
  </div>
);

/* ----------------------------------------------------------- layout */

/** List + editor split. On small screens only one pane shows at a time. */
export const ManagerLayout = ({ list, editor, showEditorOnMobile }: { list: ReactNode; editor: ReactNode; showEditorOnMobile: boolean }) => (
  <div className="lg:grid lg:grid-cols-[340px_minmax(0,1fr)]">
    <div className={showEditorOnMobile ? "hidden lg:block" : ""}>{list}</div>
    <div className={showEditorOnMobile ? "" : "hidden lg:block"}>{editor}</div>
  </div>
);

export const EditorBody = ({ children }: { children: ReactNode }) => (
  <div className="mx-auto max-w-4xl space-y-6 px-5 py-6 lg:px-8">{children}</div>
);

export const EmptyEditor = ({ title, text, action }: { title: string; text: string; action?: ReactNode }) => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
      <ImageIcon size={24} aria-hidden="true" />
    </div>
    <h2 className="font-display text-xl font-bold text-slate-900">{title}</h2>
    <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);
