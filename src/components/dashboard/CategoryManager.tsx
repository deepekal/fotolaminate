"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2, Package, Plus } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError, type CategoryRecord, type ProductRecord } from "@/lib/api";
import { slugifyCategory } from "@/lib/slug";
import {
  AdminTable,
  Breadcrumb,
  EditorLayout,
  Field,
  MetaBox,
  PageTitle,
  Panel,
  PublishBox,
  SeoPreview,
  StatusBadge,
  Thumb,
  TitleCell,
  btnPrimary,
  btnSecondary,
  formatDate,
  inputBase,
  textareaCls,
  useSaveShortcut,
  useUnloadWarning,
} from "@/components/dashboard/admin-ui";
import { useConfirm } from "@/components/dashboard/confirm";

type SectionProps = {
  /** undefined = table, "new" = new category, otherwise a category id */
  routeId?: string;
  navigate: (hash: string) => void;
  onDirtyChange: (dirty: boolean) => void;
};

type Draft = { id?: string; name: string; description: string; sort_order: number };
const emptyDraft = (sortOrder = 0): Draft => ({ name: "", description: "", sort_order: sortOrder });
const toDraft = (c: CategoryRecord): Draft => ({ id: c.id, name: c.name, description: c.description ?? "", sort_order: c.sort_order });

type MoveState = { cat: CategoryRecord; count: number; target: string };

const CategoryManager = ({ routeId, navigate, onDirtyChange }: SectionProps) => {
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CategoryRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft());
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [moving, setMoving] = useState<MoveState | null>(null);

  const editing = routeId !== undefined;
  const selected = useMemo(() => (routeId && routeId !== "new" ? items.find((c) => c.id === routeId) ?? null : null), [items, routeId]);
  const nextSortOrder = useMemo(() => (items.length ? Math.max(...items.map((c) => c.sort_order)) + 10 : 10), [items]);
  const baseline = useMemo(() => (selected ? toDraft(selected) : emptyDraft(nextSortOrder)), [selected, nextSortOrder]);
  // Only compare once the draft has been synced to this baseline, so the editor never flashes "unsaved changes" while loading.
  const [syncedBaseline, setSyncedBaseline] = useState<Draft | null>(null);
  const dirty = editing && syncedBaseline === baseline && JSON.stringify(draft) !== JSON.stringify(baseline);
  useUnloadWarning(dirty);
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  async function refresh() {
    setLoading(true);
    try {
      const [cats, prods] = await Promise.all([api.categories.list(), api.products.list()]);
      setItems(cats);
      setProducts(prods);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load categories");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  useEffect(() => {
    if (loading) return;
    setDraft(baseline);
    setSyncedBaseline(baseline);
  }, [baseline, loading]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? items.filter((c) => c.name.toLowerCase().includes(q) || c.slug.includes(q)) : items;
  }, [items, search]);

  const productsIn = (name: string) => products.filter((p) => (p.category ?? "").trim().toLowerCase() === name.toLowerCase());

  /* ------------------------------------------------------------ actions */
  async function save() {
    if (!draft.name.trim()) {
      toast.error("Give the category a name");
      return;
    }
    setSaving(true);
    try {
      const payload = { name: draft.name, description: draft.description, sort_order: draft.sort_order };
      if (draft.id) {
        await api.categories.update(draft.id, payload);
        toast.success(selected && selected.name !== draft.name.trim() ? "Category renamed — products updated" : "Category saved");
        await refresh();
      } else {
        const created = await api.categories.create(payload);
        toast.success("Category added");
        await refresh();
        onDirtyChange(false);
        navigate(`/categories/${created.id}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save category");
    } finally {
      setSaving(false);
    }
  }
  useSaveShortcut(() => void save(), editing);

  /** Returns true when the category is gone. Opens the move panel when products still use it. */
  async function remove(c: CategoryRecord, skipConfirm = false): Promise<boolean> {
    if (!skipConfirm) {
      const ok = await confirm({
        title: `Delete "${c.name}"?`,
        description: c.product_count ? `${c.product_count} product(s) use this category — you will be asked where to move them.` : "It is removed from the product editor, footer and contact form.",
        confirmLabel: "Delete",
      });
      if (!ok) return false;
    }
    try {
      await api.categories.remove(c.id);
      toast.success("Category deleted");
      await refresh();
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setMoving({ cat: c, count: Number(e.body?.product_count ?? c.product_count ?? 0), target: items.find((o) => o.id !== c.id)?.id ?? "" });
        return false;
      }
      toast.error(e instanceof Error ? e.message : "Could not delete category");
      await refresh();
      return false;
    }
  }

  async function moveAndDelete() {
    if (!moving?.target) return;
    try {
      const r = await api.categories.remove(moving.cat.id, moving.target);
      toast.success(`Moved ${r.moved} product${r.moved === 1 ? "" : "s"} and deleted "${moving.cat.name}"`);
      const wasEditingIt = draft.id === moving.cat.id;
      setMoving(null);
      await refresh();
      if (wasEditingIt) {
        onDirtyChange(false);
        navigate("/categories");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete category");
    }
  }

  async function bulk(action: string, ids: string[]) {
    if (action !== "delete") return;
    const targets = items.filter((c) => ids.includes(c.id));
    const inUse = targets.filter((c) => (c.product_count ?? 0) > 0);
    if (inUse.length) {
      toast.error(`${inUse.map((c) => `"${c.name}"`).join(", ")} still ${inUse.length === 1 ? "has" : "have"} products — delete those one at a time to move the products first.`);
      return;
    }
    if (!(await confirm({ title: `Delete ${targets.length} categor${targets.length === 1 ? "y" : "ies"}?`, confirmLabel: `Delete ${targets.length}` }))) return;
    let done = 0;
    for (const c of targets) {
      try {
        await api.categories.remove(c.id);
        done++;
      } catch {
        // report below
      }
    }
    if (done === targets.length) toast.success(`${done} categor${done === 1 ? "y" : "ies"} deleted`);
    else toast.error(`${done} of ${targets.length} deleted — some failed`);
    await refresh();
  }

  const movePanel = moving ? (
    <MetaBox title="Category still in use">
      <p className="text-slate-700">
        <b>{moving.cat.name}</b> has {moving.count} product{moving.count === 1 ? "" : "s"}. Choose where they go, then delete.
      </p>
      <Field label="Move products to">
        <select value={moving.target} onChange={(e) => setMoving({ ...moving, target: e.target.value })} className={`${inputBase} w-full`}>
          {items
            .filter((o) => o.id !== moving.cat.id)
            .map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
        </select>
      </Field>
      <div className="flex gap-2">
        <button type="button" onClick={() => void moveAndDelete()} disabled={!moving.target} className={btnPrimary}>
          Move &amp; delete
        </button>
        <button type="button" onClick={() => setMoving(null)} className={btnSecondary}>
          Cancel
        </button>
      </div>
    </MetaBox>
  ) : null;

  /* -------------------------------------------------------------- table */
  if (!editing) {
    return (
      <>
        <PageTitle
          title="Categories"
          actions={
            <button type="button" onClick={() => navigate("/categories/new")} className={btnPrimary}>
              <Plus size={16} aria-hidden="true" /> Add new
            </button>
          }
        >
          <p className="text-sm text-slate-500">Groups products on the website: product editor, footer links and the contact form. Renaming a category updates all its products.</p>
        </PageTitle>
        {moving ? <div className="px-6 pt-6 lg:max-w-md">{movePanel}</div> : null}
        <AdminTable
          rows={rows}
          loading={loading}
          columns={[{ label: "Category" }, { label: "Products", className: "w-28" }, { label: "Order", className: "w-20" }, { label: "Updated", className: "w-32" }]}
          emptyText={items.length === 0 ? "No categories yet." : "No categories match your search."}
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search categories"
          bulkActions={[{ id: "delete", label: "Delete", danger: true }]}
          onBulk={bulk}
          renderRow={(c) => (
            <>
              <TitleCell
                thumb={c.cover_image_url ?? null}
                title={c.name}
                onEdit={() => navigate(`/categories/${c.id}`)}
                viewHref={`/products/category/${c.slug}`}
                extra={[{ label: "Delete", danger: true, onClick: () => void remove(c) }]}
              />
              <td className="py-2.5 pr-4">
                {c.product_count ? (
                  <button type="button" onClick={() => navigate(`/categories/${c.id}`)} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">
                    <Package size={12} aria-hidden="true" /> {c.product_count}
                  </button>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">Empty</span>
                )}
              </td>
              <td className="py-2.5 pr-4 tabular-nums text-slate-500">{c.sort_order}</td>
              <td className="py-2.5 pr-4 text-slate-500">{formatDate(c.updated_at)}</td>
            </>
          )}
        />
      </>
    );
  }

  /* ------------------------------------------------------------- editor */
  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-slate-500">
        <Loader2 size={18} className="animate-spin" aria-hidden="true" /> Loading…
      </div>
    );
  }
  if (routeId !== "new" && !selected) {
    return (
      <div className="p-6 text-slate-600">
        This category no longer exists.{" "}
        <button type="button" onClick={() => navigate("/categories")} className="font-semibold text-accent hover:underline">
          Back to categories
        </button>
      </div>
    );
  }

  const slug = draft.name.trim() ? slugifyCategory(draft.name) : "";
  const inThisCategory = selected ? productsIn(selected.name) : [];
  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  return (
    <>
      <Breadcrumb backLabel="Categories" onBack={() => navigate("/categories")} current={draft.name || "New category"} dirty={dirty} />
      <EditorLayout
        main={
          <>
            <input
              value={draft.name}
              onChange={(e) => update("name", e.target.value)}
              maxLength={80}
              placeholder="Category name"
              aria-label="Category name"
              autoFocus={routeId === "new"}
              className="h-14 w-full rounded-md border border-slate-300 bg-white px-4 font-display text-2xl font-bold text-slate-900 shadow-sm placeholder:text-slate-300 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <p className="-mt-4 text-xs text-slate-500">
              Web address: www.fotolaminate.com/products/category/<span className="text-slate-700">{slug || "…"}</span>
              {selected && slug !== selected.slug ? <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">changes when saved</span> : null}
            </p>

            <Panel title="Description">
              <Field label="Notes" hint="For your own reference — not shown on the website.">
                <textarea value={draft.description} onChange={(e) => update("description", e.target.value)} rows={3} className={textareaCls} placeholder="What belongs in this category" />
              </Field>
            </Panel>

            <Panel
              title={`Products in this category${selected ? ` (${inThisCategory.length})` : ""}`}
              actions={
                selected ? (
                  <button type="button" onClick={() => navigate("/products/new")} className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                    <Plus size={14} aria-hidden="true" /> Add product
                  </button>
                ) : undefined
              }
            >
              {!selected ? (
                <p className="text-sm text-slate-500">Save the category first, then assign products to it from the product editor.</p>
              ) : inThisCategory.length === 0 ? (
                <p className="text-sm text-slate-500">No products yet. Open a product and pick this category in its sidebar.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {inThisCategory.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 py-2">
                      <Thumb src={p.cover_image_url} />
                      <button type="button" onClick={() => navigate(`/products/${p.id}`)} className="min-w-0 flex-1 truncate text-left text-sm font-medium text-slate-900 hover:text-accent">
                        {p.name}
                      </button>
                      <StatusBadge published={p.published} />
                      <ArrowRight size={14} className="text-slate-300" aria-hidden="true" />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="On the website">
              <SeoPreview title={`${draft.name || "Category"} Lamination Machines | Foto Laminate Precision`} description={`Discover and enquire about the best ${draft.name || "…"} lamination machines and finishing solutions manufactured by Foto Laminate Precision.`} path={`/products/category/${slug || "…"}`} />
              <p className="text-xs text-slate-500">The category page lists its published products. The name also appears in the footer under “Machines” and in the contact form’s machine-type list.</p>
            </Panel>
          </>
        }
        sidebar={
          <>
            <PublishBox
              isNew={!draft.id}
              updatedAt={selected?.updated_at}
              viewHref={selected ? `/products/category/${selected.slug}` : undefined}
              onSave={() => void save()}
              saving={saving}
              saveLabel={draft.id ? "Update" : "Add category"}
              onDelete={
                selected
                  ? () =>
                      void remove(selected).then((gone) => {
                        if (gone) {
                          onDirtyChange(false);
                          navigate("/categories");
                        }
                      })
                  : undefined
              }
            />
            {movePanel}
            <MetaBox title="Order">
              <Field label="Sort order" hint="Lower numbers show first in the footer and menus.">
                <input type="number" value={draft.sort_order} onChange={(e) => update("sort_order", Number(e.target.value) || 0)} className={`${inputBase} w-28`} />
              </Field>
            </MetaBox>
            {selected ? (
              <MetaBox title="Summary">
                <p className="text-slate-600">
                  Products: <b className="text-slate-900">{inThisCategory.length}</b> ({inThisCategory.filter((p) => p.published).length} published)
                </p>
                <p className="text-slate-600">Created: {formatDate(selected.created_at)}</p>
              </MetaBox>
            ) : null}
          </>
        }
      />
    </>
  );
};

export default CategoryManager;
