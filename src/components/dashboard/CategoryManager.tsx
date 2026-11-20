"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { api, type CategoryRecord } from "@/lib/api";
import { AdminTable, Field, PageTitle, Panel, btnPrimary, btnSecondary, formatDate, inputBase, inputCls, textareaCls } from "@/components/dashboard/admin-ui";
import { useConfirm } from "@/components/dashboard/confirm";

type Draft = { name: string; description: string; sort_order: string };
const emptyDraft = (): Draft => ({ name: "", description: "", sort_order: "0" });

const CategoryManager = () => {
  const confirm = useConfirm();
  const [items, setItems] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<CategoryRecord | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moving, setMoving] = useState<{ cat: CategoryRecord; count: number; target: string } | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setItems(await api.categories.list());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load categories");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? items.filter((c) => c.name.toLowerCase().includes(q) || c.slug.includes(q)) : items;
  }, [items, search]);

  function openNew() {
    setEditing("new");
    setDraft({ ...emptyDraft(), sort_order: String((items.at(-1)?.sort_order ?? 0) + 10) });
    setError(null);
  }
  function openEdit(c: CategoryRecord) {
    setEditing(c);
    setDraft({ name: c.name, description: c.description ?? "", sort_order: String(c.sort_order) });
    setError(null);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setError(null);
    const payload = { name: draft.name, description: draft.description, sort_order: Number(draft.sort_order) || 0 };
    try {
      if (editing === "new") {
        await api.categories.create(payload);
        toast.success("Category added");
      } else {
        await api.categories.update(editing.id, payload);
        toast.success(editing.name !== draft.name.trim() ? "Category renamed and products updated" : "Category saved");
      }
      setEditing(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save category");
    } finally {
      setSaving(false);
    }
  }

  async function remove(c: CategoryRecord) {
    const ok = await confirm({ title: `Delete "${c.name}"?`, description: "The category is removed from the admin list, footer and contact form.", confirmLabel: "Delete" });
    if (!ok) return;
    try {
      await api.categories.remove(c.id);
      toast.success("Category deleted");
      await refresh();
    } catch (e) {
      const count = c.product_count ?? 0;
      if (count > 0) setMoving({ cat: c, count, target: items.find((o) => o.id !== c.id)?.id ?? "" });
      else toast.error(e instanceof Error ? e.message : "Could not delete category");
    }
  }

  async function moveAndDelete() {
    if (!moving?.target) return;
    try {
      const r = await api.categories.remove(moving.cat.id, moving.target);
      toast.success(`Moved ${r.moved} product${r.moved === 1 ? "" : "s"} and deleted the category`);
      setMoving(null);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete category");
    }
  }

  return (
    <>
      <PageTitle
        title="Categories"
        actions={
          <button type="button" onClick={openNew} className={btnPrimary}>
            <Plus className="h-4 w-4" /> Add category
          </button>
        }
      >
        <p className="text-sm text-slate-500">Product categories shown in the product editor, footer and contact form. Renaming updates every product in that category.</p>
      </PageTitle>

      <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <AdminTable
            rows={rows}
            loading={loading}
            columns={[{ label: "Name" }, { label: "Slug", className: "w-64" }, { label: "Products", className: "w-24" }, { label: "Updated", className: "w-32" }]}
            emptyText={items.length === 0 ? "No categories yet." : "No categories match."}
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Search categories"
            renderRow={(c) => (
              <>
                <td className="py-2.5 pr-4">
                  <div className="font-medium text-slate-900">{c.name}</div>
                  <div className="mt-0.5 flex gap-3 text-xs">
                    <button type="button" onClick={() => openEdit(c)} className="font-medium text-accent hover:underline">
                      Edit
                    </button>
                    <a href={`/products/category/${c.slug}`} target="_blank" rel="noreferrer" className="text-slate-500 hover:underline">
                      View
                    </a>
                    <button type="button" onClick={() => void remove(c)} className="font-medium text-red-600 hover:underline">
                      Delete
                    </button>
                  </div>
                </td>
                <td className="py-2.5 pr-4 font-mono text-xs text-slate-500">{c.slug}</td>
                <td className="py-2.5 pr-4 tabular-nums text-slate-600">{c.product_count ?? 0}</td>
                <td className="py-2.5 pr-4 text-slate-500">{formatDate(c.updated_at)}</td>
              </>
            )}
          />
        </div>

        <div className="space-y-4">
          {editing ? (
            <Panel title={editing === "new" ? "Add category" : "Edit category"}>
              {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
              <Field label="Name">
                <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputCls} maxLength={80} autoFocus />
              </Field>
              <Field label="Description" hint="Optional, for your own reference.">
                <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className={textareaCls} rows={3} />
              </Field>
              <Field label="Sort order" hint="Lower numbers appear first in the footer and lists.">
                <input type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })} className={`${inputBase} w-32`} />
              </Field>
              <div className="flex gap-2">
                <button type="button" onClick={() => void save()} disabled={saving || !draft.name.trim()} className={btnPrimary}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {editing === "new" ? "Add" : "Save"}
                </button>
                <button type="button" onClick={() => setEditing(null)} className={btnSecondary}>
                  Cancel
                </button>
              </div>
            </Panel>
          ) : (
            <Panel title="Tips">
              <ul className="list-disc space-y-1.5 pl-4 text-sm text-slate-600">
                <li>Click Edit on a row to rename it; products keep the new name automatically.</li>
                <li>A category that still has products cannot be deleted until they are moved.</li>
              </ul>
            </Panel>
          )}

          {moving ? (
            <Panel title="Category in use">
              <p className="text-sm text-slate-700">
                <strong>{moving.cat.name}</strong> has {moving.count} product{moving.count === 1 ? "" : "s"}. Move them to another category, then delete.
              </p>
              <Field label="Move products to">
                <select value={moving.target} onChange={(e) => setMoving({ ...moving, target: e.target.value })} className={inputCls}>
                  {items.filter((o) => o.id !== moving.cat.id).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex gap-2">
                <button type="button" onClick={() => void moveAndDelete()} disabled={!moving.target} className={btnPrimary}>
                  Move and delete
                </button>
                <button type="button" onClick={() => setMoving(null)} className={btnSecondary}>
                  Cancel
                </button>
              </div>
            </Panel>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default CategoryManager;
