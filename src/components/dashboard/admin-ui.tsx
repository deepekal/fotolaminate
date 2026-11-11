"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, ImageIcon, Loader2, Plus, Search, Trash2, Upload, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import FAQEditor from "@/components/dashboard/FAQEditor";
import { api, type UploadedImage } from "@/lib/api";
import type { PageFAQ } from "@/lib/page-types";
import { useConfirm } from "@/components/dashboard/confirm";

/* ------------------------------------------------------------------ styles */

/** Input styling without a width — combine with an explicit width (w-52 etc.). */
export const inputBase =
  "h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-slate-50";
export const inputCls = `${inputBase} w-full`;
export const textareaCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";
export const monoCls = `${textareaCls} font-mono text-xs`;

const btnBase =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md px-3.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50";
export const btnPrimary = `${btnBase} bg-accent text-accent-foreground shadow-sm hover:bg-accent/90`;
export const btnSecondary = `${btnBase} border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50`;
export const btnGhost = `${btnBase} text-slate-600 hover:bg-slate-100`;
export const linkBtn = "text-sm font-medium text-accent hover:underline disabled:opacity-50";

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

/** Warn before closing the tab with unsaved edits. */
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

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
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
  let tone = "text-slate-400";
  if (counter && counter.value > 0) {
    const [min, max] = counter.ideal;
    tone = counter.value > max ? "text-red-600" : counter.value >= min ? "text-emerald-600" : "text-amber-600";
  }
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {counter ? <span className={`text-xs tabular-nums ${tone}`}>{counter.value} / {counter.ideal[1]}</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs leading-relaxed text-slate-500">{hint}</span> : null}
    </label>
  );
};

/** White panel in the main editor column. */
export const Panel = ({ title, actions, children, id }: { title: string; actions?: ReactNode; children: ReactNode; id?: string }) => (
  <section id={id} className="scroll-mt-6 rounded-md border border-slate-200 bg-white shadow-sm">
    <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {actions}
    </header>
    <div className="space-y-5 p-4">{children}</div>
  </section>
);

/** Box in the right-hand sidebar of the editor (WordPress-style). */
export const MetaBox = ({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) => (
  <section className="rounded-md border border-slate-200 bg-white shadow-sm">
    <h3 className="border-b border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900">{title}</h3>
    <div className="space-y-3 px-4 py-3 text-sm">{children}</div>
    {footer ? <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">{footer}</div> : null}
  </section>
);

export const StatusBadge = ({ published }: { published: boolean }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
      published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
    }`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${published ? "bg-emerald-500" : "bg-amber-500"}`} aria-hidden="true" />
    {published ? "Published" : "Draft"}
  </span>
);

export const Thumb = ({ src }: { src?: string | null }) => (
  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-200 bg-white">
    {src ? <img src={src} alt="" className="h-full w-full object-contain" loading="lazy" /> : <ImageIcon size={16} className="text-slate-300" aria-hidden="true" />}
  </span>
);

/* -------------------------------------------------------------- page chrome */

export const PageTitle = ({ title, actions, children }: { title: string; actions?: ReactNode; children?: ReactNode }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-4">
    <div>
      <h2 className="font-display text-2xl font-bold text-slate-900">{title}</h2>
      {children}
    </div>
    {actions}
  </div>
);

export const Breadcrumb = ({ backLabel, onBack, current, dirty }: { backLabel: string; onBack: () => void; current: string; dirty?: boolean }) => (
  <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-6 py-3 text-sm">
    <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900">
      <ChevronLeft size={16} aria-hidden="true" /> {backLabel}
    </button>
    <span className="text-slate-300">/</span>
    <span className="truncate font-semibold text-slate-900">{current}</span>
    {dirty ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Unsaved changes</span> : null}
    <span className="ml-auto hidden text-xs text-slate-400 md:inline">Ctrl/Cmd + S to save</span>
  </div>
);

export const EditorLayout = ({ main, sidebar }: { main: ReactNode; sidebar: ReactNode }) => (
  <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_300px]">
    <div className="min-w-0 space-y-6">{main}</div>
    <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">{sidebar}</aside>
  </div>
);

export const PublishBox = ({
  published,
  onPublishedChange,
  updatedAt,
  isNew,
  viewHref,
  onSave,
  saving,
  onDelete,
  saveLabel,
}: {
  published?: boolean;
  onPublishedChange?: (v: boolean) => void;
  updatedAt?: string | null;
  isNew: boolean;
  viewHref?: string;
  onSave: () => void;
  saving: boolean;
  onDelete?: () => void;
  saveLabel?: string;
}) => (
  <MetaBox
    title="Publish"
    footer={
      <>
        {onDelete && !isNew ? (
          <button type="button" onClick={onDelete} className="text-sm font-medium text-red-600 hover:underline">
            Delete
          </button>
        ) : (
          <span />
        )}
        <button type="button" onClick={onSave} disabled={saving} className={btnPrimary}>
          {saving ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
          {saving ? "Saving…" : saveLabel ?? (isNew ? "Publish" : "Update")}
        </button>
      </>
    }
  >
    {onPublishedChange && published !== undefined ? (
      <label className="flex cursor-pointer items-center justify-between">
        <span className="text-slate-600">
          Status: <b className={published ? "text-emerald-700" : "text-amber-700"}>{published ? "Published" : "Draft"}</b>
        </span>
        <Switch checked={published} onCheckedChange={onPublishedChange} aria-label="Published" />
      </label>
    ) : null}
    {isNew ? <p className="text-slate-600">Not saved yet</p> : updatedAt ? <p className="text-slate-600">Last updated: {formatDate(updatedAt)}</p> : null}
    {viewHref ? (
      <Link href={viewHref} target="_blank" className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline">
        <ExternalLink size={14} aria-hidden="true" /> View on website
      </Link>
    ) : null}
  </MetaBox>
);

/* ----------------------------------------------------------------- table */

export type BulkAction = { id: string; label: string; danger?: boolean };

export function AdminTable<T extends { id: string }>({
  rows,
  loading,
  columns,
  renderRow,
  emptyText,
  statusCounts,
  status,
  onStatus,
  filterSlot,
  search,
  onSearch,
  searchPlaceholder,
  bulkActions,
  onBulk,
  pageSize = 20,
}: {
  rows: T[];
  loading: boolean;
  columns: { label: string; className?: string }[];
  renderRow: (row: T) => ReactNode;
  emptyText: string;
  statusCounts?: { all: number; published: number; draft: number };
  status?: "all" | "published" | "draft";
  onStatus?: (s: "all" | "published" | "draft") => void;
  filterSlot?: ReactNode;
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder: string;
  bulkActions?: BulkAction[];
  onBulk?: (actionId: string, ids: string[]) => Promise<void>;
  pageSize?: number;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [bulk, setBulk] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => setPage(0), [search, status, rows.length]);
  useEffect(() => setSelected((s) => new Set([...s].filter((id) => rows.some((r) => r.id === id)))), [rows]);

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const visible = rows.slice(page * pageSize, page * pageSize + pageSize);
  const allVisibleSelected = visible.length > 0 && visible.every((r) => selected.has(r.id));

  function toggleAll() {
    setSelected((s) => {
      const next = new Set(s);
      if (allVisibleSelected) visible.forEach((r) => next.delete(r.id));
      else visible.forEach((r) => next.add(r.id));
      return next;
    });
  }

  async function applyBulk() {
    if (!bulk || !onBulk || selected.size === 0) return;
    setBusy(true);
    try {
      await onBulk(bulk, [...selected]);
      setSelected(new Set());
      setBulk("");
    } finally {
      setBusy(false);
    }
  }

  const statusLink = (key: "all" | "published" | "draft", label: string, count: number) => (
    <button
      type="button"
      onClick={() => onStatus?.(key)}
      className={status === key ? "font-semibold text-slate-900" : "text-accent hover:underline"}
      aria-pressed={status === key}
    >
      {label} <span className="text-slate-400">({count})</span>
    </button>
  );

  return (
    <div className="bg-white">
      <div className="flex flex-wrap items-center gap-3 px-6 py-3 text-sm">
        {statusCounts && onStatus ? (
          <div className="flex items-center gap-2">
            {statusLink("all", "All", statusCounts.all)}
            <span className="text-slate-300">|</span>
            {statusLink("published", "Published", statusCounts.published)}
            <span className="text-slate-300">|</span>
            {statusLink("draft", "Drafts", statusCounts.draft)}
          </div>
        ) : null}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {filterSlot}
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className={`${inputBase} h-9 w-56 pl-8`}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-y border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500">
            <tr>
              {bulkActions ? (
                <th className="w-12 px-6 py-2.5">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} aria-label="Select all on this page" />
                </th>
              ) : null}
              {columns.map((c) => (
                <th key={c.label} className={`py-2.5 pr-4 first:pl-6 ${c.className ?? ""}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-10 text-center text-slate-500">
                  <Loader2 size={18} className="mr-2 inline animate-spin" aria-hidden="true" /> Loading…
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-10 text-center text-slate-500">
                  {emptyText}
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr key={row.id} className={`group align-middle ${selected.has(row.id) ? "bg-accent/5" : "hover:bg-slate-50"}`}>
                  {bulkActions ? (
                    <td className="px-6 py-2.5">
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() =>
                          setSelected((s) => {
                            const next = new Set(s);
                            if (next.has(row.id)) next.delete(row.id);
                            else next.add(row.id);
                            return next;
                          })
                        }
                        aria-label="Select row"
                      />
                    </td>
                  ) : null}
                  {renderRow(row)}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 px-6 py-3 text-sm text-slate-600">
        {bulkActions && onBulk ? (
          <div className="flex items-center gap-2">
            <select value={bulk} onChange={(e) => setBulk(e.target.value)} className={`${inputBase} h-9 w-44`} aria-label="Bulk actions">
              <option value="">Bulk actions</option>
              {bulkActions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => void applyBulk()} disabled={!bulk || selected.size === 0 || busy} className={btnSecondary}>
              {busy ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null} Apply
            </button>
            {selected.size > 0 ? <span className="text-xs text-slate-500">{selected.size} selected</span> : null}
          </div>
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          <span>
            {rows.length === 0 ? 0 : page * pageSize + 1}–{Math.min(rows.length, (page + 1) * pageSize)} of {rows.length}
          </span>
          <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className={`${btnGhost} h-8 px-2`} aria-label="Previous page">
            <ChevronLeft size={16} />
          </button>
          <button type="button" onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1} className={`${btnGhost} h-8 px-2`} aria-label="Next page">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Title cell with WordPress-style row actions on hover. */
export const TitleCell = ({
  thumb,
  title,
  onEdit,
  viewHref,
  extra,
}: {
  thumb?: string | null;
  title: string;
  onEdit: () => void;
  viewHref?: string;
  extra?: { label: string; onClick: () => void; danger?: boolean }[];
}) => (
  <td className="py-2.5 pr-4 first:pl-6">
    <div className="flex items-center gap-3">
      {thumb !== undefined ? <Thumb src={thumb} /> : null}
      <div className="min-w-0">
        <button type="button" onClick={onEdit} className="block max-w-[28rem] truncate text-left font-semibold text-slate-900 hover:text-accent">
          {title || "(no title)"}
        </button>
        <div className="mt-0.5 flex gap-2 text-xs opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <button type="button" onClick={onEdit} className="text-accent hover:underline">
            Edit
          </button>
          {viewHref ? (
            <>
              <span className="text-slate-300">|</span>
              <Link href={viewHref} target="_blank" className="text-accent hover:underline">
                View
              </Link>
            </>
          ) : null}
          {extra?.map((x) => (
            <span key={x.label} className="flex gap-2">
              <span className="text-slate-300">|</span>
              <button type="button" onClick={x.onClick} className={x.danger ? "text-red-600 hover:underline" : "text-accent hover:underline"}>
                {x.label}
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  </td>
);

/* ------------------------------------------------------------- media */

export const MediaPicker = ({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (url: string) => void }) => {
  const [items, setItems] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.uploads
      .list()
      .then(setItems)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not load media"))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        const saved = await api.uploads.upload(f);
        setItems((list) => [saved, ...list]);
      }
      toast.success("Uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Media library">
      <button type="button" className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-label="Close" />
      <div className="relative flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="font-semibold text-slate-900">Choose an image</h3>
          <div className="flex items-center gap-2">
            <label className={`${btnPrimary} cursor-pointer`}>
              {uploading ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Upload size={15} aria-hidden="true" />}
              {uploading ? "Uploading…" : "Upload new"}
              <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => void upload(e.target.files)} />
            </label>
            <button type="button" onClick={onClose} className={btnGhost} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">No uploaded images yet. Use “Upload new”.</p>
          ) : (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {items.map((it) => (
                <li key={it.name}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(it.url);
                      onClose();
                    }}
                    className="group block w-full overflow-hidden rounded-md border border-slate-200 bg-slate-50 hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    title={it.name}
                  >
                    <img src={it.url} alt="" className="aspect-square w-full object-contain p-1" loading="lazy" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

/** Image picker with preview: upload, choose from library, or paste an address. */
export const ImageBox = ({ value, onChange, emptyHint }: { value: string; onChange: (v: string) => void; emptyHint?: string }) => {
  const confirm = useConfirm();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    try {
      const saved = await api.uploads.upload(file);
      onChange(saved.url);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div
        className="flex h-40 items-center justify-center overflow-hidden rounded border border-dashed border-slate-300 bg-slate-50"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) void upload(f);
        }}
      >
        {uploading ? (
          <Loader2 size={22} className="animate-spin text-slate-400" aria-hidden="true" />
        ) : value ? (
          <img src={value} alt="" className="h-full w-full object-contain p-2" />
        ) : (
          <span className="px-4 text-center text-xs text-slate-500">{emptyHint ?? "Drop an image here"}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <label className={`${linkBtn} cursor-pointer`}>
          {value ? "Replace" : "Upload"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = "";
            }}
          />
        </label>
        <button type="button" onClick={() => setPickerOpen(true)} className={linkBtn}>
          Media library
        </button>
        <button type="button" onClick={() => setShowUrl((v) => !v)} className={linkBtn}>
          {showUrl ? "Hide address" : "Image address"}
        </button>
        {value ? (
          <button
            type="button"
            onClick={async () => {
              const ok = await confirm({
                title: "Remove this image?",
                description: "It will be removed from this item when you save. The file itself stays in the Media library.",
                confirmLabel: "Remove image",
              });
              if (ok) onChange("");
            }}
            className="text-sm font-medium text-red-600 hover:underline"
          >
            Remove
          </button>
        ) : null}
      </div>
      {showUrl ? <input value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} placeholder="https://… or /uploads/…" aria-label="Image address" /> : null}
      <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={onChange} />
    </div>
  );
};

/** Several images (gallery). Value is a comma-separated list of addresses. */
export const GalleryField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const confirm = useConfirm();
  const urls = useMemo(() => value.split(",").map((s) => s.trim()).filter(Boolean), [value]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = (list: string[]) => onChange(list.join(", "));

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const added: string[] = [];
      for (const f of Array.from(files)) added.push((await api.uploads.upload(f)).url);
      set([...urls, ...added]);
      toast.success("Images uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {urls.length ? (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {urls.map((u, i) => (
            <li key={`${u}-${i}`} className="relative">
              <img src={u} alt="" className="aspect-square w-full rounded border border-slate-200 bg-slate-50 object-contain p-1" />
              <button
                type="button"
                onClick={async () => {
                  const ok = await confirm({
                    title: "Remove this gallery image?",
                    description: "It will be removed from the gallery when you save. The file itself stays in the Media library.",
                    confirmLabel: "Remove image",
                  });
                  if (ok) set(urls.filter((_, idx) => idx !== i));
                }}
                className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-slate-600 shadow hover:text-red-600"
                aria-label="Remove image"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">No gallery images.</p>
      )}
      <div className="flex flex-wrap gap-2">
        <label className={`${btnSecondary} cursor-pointer`}>
          {uploading ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Upload size={15} aria-hidden="true" />}
          {uploading ? "Uploading…" : "Upload images"}
          <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => void upload(e.target.files)} />
        </label>
        <button type="button" onClick={() => setPickerOpen(true)} className={btnSecondary}>
          <ImageIcon size={15} aria-hidden="true" /> Media library
        </button>
      </div>
      <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={(u) => set([...urls, u])} />
    </div>
  );
};

/* --------------------------------------------------------------- SEO */

export const SeoPreview = ({ title, description, path }: { title: string; description: string; path: string }) => (
  <div className="rounded border border-slate-200 bg-slate-50 p-4">
    <p className="mb-2 text-xs font-medium text-slate-500">Google search preview</p>
    <p className="truncate text-xs text-slate-600">www.fotolaminate.com{path}</p>
    <p className="mt-0.5 line-clamp-1 text-lg leading-snug text-[#1a0dab]">{title || "Page title"}</p>
    <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-slate-600">{description || "Add a meta description so search results show a useful summary."}</p>
  </div>
);

/* --------------------------------------------------------- FAQs & JSON */

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
}) => {
  const confirm = useConfirm();
  async function remove(i: number) {
    if (items[i].trim() && items[i].trim() !== "{") {
      const ok = await confirm({ title: `Remove schema ${i + 1}?`, description: "This structured data will be removed when you save.", confirmLabel: "Remove" });
      if (!ok) return;
    }
    onChange(items.filter((_, idx) => idx !== i));
  }
  return (
  <div className="space-y-3">
    {items.length === 0 ? (
      <p className="text-sm text-slate-500">{emptyText}</p>
    ) : (
      items.map((item, i) => (
        <div key={i} className="rounded border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <span className="text-xs font-semibold text-slate-500">Schema {i + 1}</span>
            <button type="button" onClick={() => void remove(i)} className="text-xs font-semibold text-red-600 hover:underline">
              Remove
            </button>
          </div>
          <textarea
            value={item}
            onChange={(e) => onChange(items.map((s, idx) => (idx === i ? e.target.value : s)))}
            rows={6}
            spellCheck={false}
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
};

/* --------------------------------------------------------- specifications */

type SpecRow = { key: string; value: string; list: boolean };

function specsToRows(json: string): SpecRow[] | null {
  try {
    const obj = JSON.parse(json || "{}") as Record<string, unknown>;
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;
    const rows: SpecRow[] = [];
    for (const [key, v] of Object.entries(obj)) {
      if (typeof v === "string" || typeof v === "number") rows.push({ key, value: String(v), list: false });
      else if (Array.isArray(v) && v.every((x) => typeof x === "string" || typeof x === "number")) rows.push({ key, value: v.join(", "), list: true });
      else return null; // unexpected shape — fall back to raw JSON editing
    }
    return rows;
  } catch {
    return null;
  }
}

function rowsToSpecs(rows: SpecRow[]): string {
  const obj: Record<string, string | string[]> = {};
  for (const r of rows) {
    const key = r.key.trim();
    if (!key) continue;
    obj[key] = r.list ? r.value.split(",").map((s) => s.trim()).filter(Boolean) : r.value;
  }
  return JSON.stringify(obj, null, 2);
}

/**
 * Specifications as simple rows. Rows that were lists stay lists (comma-separated
 * while editing). Unusual data falls back to a raw JSON box so nothing is lost.
 */
export const SpecsEditor = ({ value, onChange }: { value: string; onChange: (json: string) => void }) => {
  const confirm = useConfirm();
  const parsed = useMemo(() => specsToRows(value), [value]);
  const [rawMode, setRawMode] = useState(parsed === null);
  // Working copy, so rows that are still empty (not yet saved into the JSON) stay visible.
  const [rows, setLocalRows] = useState<SpecRow[]>(parsed ?? []);
  const lastEmitted = useRef(value);
  useEffect(() => {
    if (value !== lastEmitted.current) {
      setLocalRows(specsToRows(value) ?? []);
      lastEmitted.current = value;
    }
  }, [value]);
  const setRows = (next: SpecRow[]) => {
    setLocalRows(next);
    const json = rowsToSpecs(next);
    lastEmitted.current = json;
    onChange(json);
  };

  if (rawMode || parsed === null) {
    return (
      <div className="space-y-2">
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={10} spellCheck={false} className={monoCls} />
        {parsed !== null ? (
          <button
            type="button"
            onClick={() => {
              setLocalRows(specsToRows(value) ?? []);
              setRawMode(false);
            }}
            className={linkBtn}
          >
            Back to simple rows
          </button>
        ) : (
          <p className="text-xs text-amber-700">These specifications need to be valid JSON.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rows.length === 0 ? <p className="text-sm text-slate-500">No specifications yet.</p> : null}
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] items-start gap-2">
          <input
            value={r.key}
            onChange={(e) => setRows(rows.map((x, idx) => (idx === i ? { ...x, key: e.target.value } : x)))}
            className={inputCls}
            placeholder="e.g. Lamination width"
            aria-label="Specification name"
          />
          <div>
            <input
              value={r.value}
              onChange={(e) => setRows(rows.map((x, idx) => (idx === i ? { ...x, value: e.target.value } : x)))}
              className={inputCls}
              placeholder={r.list ? "Item one, item two" : "e.g. 14 inches"}
              aria-label="Specification value"
            />
            {r.list ? <span className="mt-1 block text-[11px] text-slate-500">List — separate items with commas</span> : null}
          </div>
          <button
            type="button"
            onClick={async () => {
              if (r.key.trim() || r.value.trim()) {
                const ok = await confirm({
                  title: `Remove “${r.key.trim() || "this specification"}”?`,
                  description: "This row will be removed when you save.",
                  confirmLabel: "Remove",
                });
                if (!ok) return;
              }
              setRows(rows.filter((_, idx) => idx !== i));
            }}
            className={`${btnGhost} h-10 px-2.5`}
            aria-label="Remove specification"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button type="button" onClick={() => setRows([...rows, { key: "", value: "", list: false }])} className={btnSecondary}>
          <Plus size={15} aria-hidden="true" /> Add row
        </button>
        <button type="button" onClick={() => setRows([...rows, { key: "", value: "", list: true }])} className={linkBtn}>
          + Add list row
        </button>
        <button type="button" onClick={() => setRawMode(true)} className="ml-auto text-xs text-slate-500 hover:underline">
          Edit as JSON
        </button>
      </div>
    </div>
  );
};
