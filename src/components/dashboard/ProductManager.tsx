"use client";

import { useEffect, useMemo, useState } from "react";
import { api, ProductRecord } from "@/lib/api";
import { slugify } from "@/lib/slug";
import { toast } from "sonner";
import {
  AdminTable,
  Breadcrumb,
  EditorLayout,
  FaqField,
  Field,
  GalleryField,
  ImageBox,
  MetaBox,
  PageTitle,
  Panel,
  PublishBox,
  SeoPreview,
  SpecsEditor,
  StatusBadge,
  TitleCell,
  btnPrimary,
  formatDate,
  inputBase,
  inputCls,
  textareaCls,
  useSaveShortcut,
  useUnloadWarning,
} from "@/components/dashboard/admin-ui";
import RichTextEditor from "@/components/dashboard/RichTextEditor";
import { Loader2, Plus } from "lucide-react";

type ProductDraft = {
  id?: string;
  name: string;
  slug: string;
  category: string;
  summary: string;
  description: string;
  features: string;
  specsJson: string;
  coverImageUrl: string;
  ogImageUrl: string;
  galleryUrls: string;
  videoUrl: string;
  faqs: string[];
  metaTitle: string;
  metaDescription: string;
  keywordString: string;
  published: boolean;
};

function splitCommaList(input: string) {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function emptyDraft(): ProductDraft {
  return {
    name: "",
    slug: "",
    category: "",
    summary: "",
    description: "",
    features: "",
    specsJson: "{}",
    coverImageUrl: "",
    ogImageUrl: "",
    galleryUrls: "",
    videoUrl: "",
    faqs: [],
    metaTitle: "",
    metaDescription: "",
    keywordString: "",
    published: true,
  };
}

/** Normalise an array-like field that may arrive as:
 *  1. A proper string[]              → ["Fast", "Quiet"]
 *  2. A JSON string of an array      → "[\"Fast\",\"Quiet\"]"
 *  3. A text[] whose sole element    → ["[\"Fast\",\"Quiet\"]"]
 *     is a JSON-encoded array string
 */
function normaliseFeatures(raw: unknown): string[] {
  // Case 2: raw string that looks like a JSON array
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      } catch { /* fall through */ }
    }
    // Plain comma-separated string fallback
    return trimmed ? trimmed.split(",").map((s) => s.trim()).filter(Boolean) : [];
  }

  if (!Array.isArray(raw)) return [];

  // Case 3: array with one element that is itself a JSON array string
  if (raw.length === 1 && typeof raw[0] === "string") {
    const trimmed = (raw[0] as string).trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      } catch { /* fall through */ }
    }
  }

  // Case 1: proper string[]
  return (raw as unknown[]).map(String).filter(Boolean);
}

/** Normalise specs which may be a parsed object, a JSON string, or null/undefined. */
function normaliseSpecs(raw: unknown): unknown {
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed) {
      try { return JSON.parse(trimmed); } catch { return {}; }
    }
    return {};
  }
  return raw ?? {};
}


function toDraft(r: ProductRecord): ProductDraft {
  const faqs = Array.isArray(r.faqs)
    ? r.faqs.map((faq) => JSON.stringify(faq, null, 2))
    : [];

  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    category: r.category ?? "",
    summary: r.summary ?? "",
    description: r.description ?? "",
    features: normaliseFeatures(r.features).join(", "),
    specsJson: JSON.stringify(normaliseSpecs(r.specs), null, 2),
    coverImageUrl: r.cover_image_url ?? "",
    ogImageUrl: r.og_image_url ?? "",
    galleryUrls: normaliseFeatures(r.gallery_image_urls).join(", "),
    videoUrl: r.video_url ?? "",
    faqs,
    metaTitle: r.meta_title ?? "",
    metaDescription: r.meta_description ?? "",
    keywordString: normaliseFeatures(r.keywords).join(", "),
    published: r.published ?? true,
  };
}


/** Full record → API payload (the update endpoint replaces every field). */
function recordToPayload(r: ProductRecord, overrides: Partial<ProductRecord> = {}) {
  return {
    name: r.name,
    slug: r.slug,
    category: r.category,
    summary: r.summary,
    description: r.description ?? "",
    features: normaliseFeatures(r.features),
    specs: normaliseSpecs(r.specs),
    meta_title: r.meta_title,
    meta_description: r.meta_description,
    keywords: normaliseFeatures(r.keywords),
    cover_image_url: r.cover_image_url,
    og_image_url: r.og_image_url,
    gallery_image_urls: normaliseFeatures(r.gallery_image_urls),
    faqs: Array.isArray(r.faqs) ? r.faqs : [],
    video_url: r.video_url,
    published: r.published,
    ...overrides,
  };
}

type SectionProps = {
  /** undefined = table, "new" = new product, otherwise a product id */
  routeId?: string;
  navigate: (hash: string) => void;
  onDirtyChange: (dirty: boolean) => void;
};

const ProductManager = ({ routeId, navigate, onDirtyChange }: SectionProps) => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [draft, setDraft] = useState<ProductDraft>(() => emptyDraft());
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState<string | null>(null);

  const editing = routeId !== undefined;
  const selectedProduct = useMemo(() => (routeId && routeId !== "new" ? products.find((p) => p.id === routeId) ?? null : null), [products, routeId]);

  const baseline = useMemo(() => (selectedProduct ? toDraft(selectedProduct) : emptyDraft()), [selectedProduct]);
  const dirty = editing && JSON.stringify(draft) !== JSON.stringify(baseline);
  useUnloadWarning(dirty);
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => (p.category ?? "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [products],
  );

  const counts = useMemo(
    () => ({ all: products.length, published: products.filter((p) => p.published).length, draft: products.filter((p) => !p.published).length }),
    [products],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (status === "all" || (status === "published") === p.published) &&
        (!category || (p.category ?? "") === category) &&
        (!q || p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || (p.category ?? "").toLowerCase().includes(q)),
    );
  }, [products, search, status, category]);

  async function refresh() {
    setLoading(true);
    try {
      const list = await api.products.list();
      setProducts(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  // Load the draft whenever the route or the underlying record changes.
  useEffect(() => {
    if (routeId === "new") setDraft(emptyDraft());
    else if (selectedProduct) setDraft(toDraft(selectedProduct));
    setNewCategory(null);
  }, [routeId, selectedProduct]);

  function update<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function onNameChange(name: string) {
    update("name", name);
    if (!draft.id && !draft.slug.trim()) {
      update("slug", slugify(name));
    }
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      if (!draft.name.trim()) throw new Error("Name is required");
      if (!draft.slug.trim()) throw new Error("Web address is required");

      let specs: unknown;
      try {
        specs = JSON.parse(draft.specsJson || "{}");
      } catch {
        throw new Error("Specifications must be valid JSON.");
      }

      // Parse FAQs from JSON strings
      const faqs = draft.faqs
        .map((f) => {
          try {
            return JSON.parse(f);
          } catch {
            return null;
          }
        })
        .filter((v): v is { q: string; a: string } => v !== null && typeof v.q === "string" && typeof v.a === "string");

      const payload = {
        name: draft.name,
        slug: draft.slug,
        category: draft.category.trim() || null,
        summary: draft.summary.trim() || null,
        description: draft.description,
        features: splitCommaList(draft.features),
        specs,
        meta_title: draft.metaTitle.trim() || null,
        meta_description: draft.metaDescription.trim() || null,
        keywords: splitCommaList(draft.keywordString),
        cover_image_url: draft.coverImageUrl.trim() || null,
        og_image_url: (draft.ogImageUrl.trim() || draft.coverImageUrl.trim()) || null,
        gallery_image_urls: splitCommaList(draft.galleryUrls),
        faqs,
        video_url: draft.videoUrl.trim() || null,
        published: draft.published,
      };

      if (draft.id) {
        await api.products.update(draft.id, payload);
        toast.success("Product updated");
        await refresh();
      } else {
        const created = await api.products.create(payload);
        toast.success("Product created");
        await refresh();
        navigate(`/products/${created.id}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  useSaveShortcut(() => void save(), editing);

  async function removeProduct(p: Pick<ProductRecord, "id" | "name">) {
    if (!window.confirm(`Delete "${p.name}"? This can't be undone.`)) return false;
    try {
      await api.products.remove(p.id);
      toast.success("Product deleted");
      await refresh();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete product");
      return false;
    }
  }

  async function duplicate(p: ProductRecord) {
    let slug = `${p.slug}-copy`;
    for (let n = 2; products.some((x) => x.slug === slug); n++) slug = `${p.slug}-copy-${n}`;
    try {
      const created = await api.products.create(recordToPayload(p, { name: `${p.name} (copy)`, slug, published: false }));
      toast.success("Copy created as a draft");
      await refresh();
      navigate(`/products/${created.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to duplicate product");
    }
  }

  async function bulk(action: string, ids: string[]) {
    const targets = products.filter((p) => ids.includes(p.id));
    if (action === "delete" && !window.confirm(`Delete ${targets.length} product(s)? This can't be undone.`)) return;
    let done = 0;
    for (const p of targets) {
      try {
        if (action === "delete") await api.products.remove(p.id);
        else await api.products.update(p.id, recordToPayload(p, { published: action === "publish" }));
        done++;
      } catch {
        // continue with the rest; report below
      }
    }
    if (done === targets.length) toast.success(`${done} product(s) updated`);
    else toast.error(`${done} of ${targets.length} updated — some failed`);
    await refresh();
  }

  /* ---------------------------------------------------------------- table */
  if (!editing) {
    return (
      <>
        <PageTitle
          title="Products"
          actions={
            <button type="button" onClick={() => navigate("/products/new")} className={btnPrimary}>
              <Plus size={16} aria-hidden="true" /> Add product
            </button>
          }
        />
        <AdminTable
          rows={rows}
          loading={loading}
          columns={[{ label: "Product" }, { label: "Category", className: "w-56" }, { label: "Status", className: "w-28" }, { label: "Updated", className: "w-32" }]}
          emptyText={products.length === 0 ? "No products yet." : "No products match these filters."}
          statusCounts={counts}
          status={status}
          onStatus={setStatus}
          filterSlot={
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputBase} h-9 w-52`} aria-label="Filter by category">
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          }
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search products"
          bulkActions={[
            { id: "publish", label: "Publish" },
            { id: "draft", label: "Move to draft" },
            { id: "delete", label: "Delete", danger: true },
          ]}
          onBulk={bulk}
          renderRow={(p) => (
            <>
              <TitleCell
                thumb={p.cover_image_url}
                title={p.name}
                onEdit={() => navigate(`/products/${p.id}`)}
                viewHref={p.published ? `/products/${p.slug}` : undefined}
                extra={[
                  { label: "Duplicate", onClick: () => void duplicate(p) },
                  { label: "Delete", danger: true, onClick: () => void removeProduct(p) },
                ]}
              />
              <td className="py-2.5 pr-4 text-slate-600">{p.category || <span className="text-slate-400">—</span>}</td>
              <td className="py-2.5 pr-4">
                <StatusBadge published={p.published} />
              </td>
              <td className="py-2.5 pr-4 text-slate-500">{formatDate(p.updated_at)}</td>
            </>
          )}
        />
      </>
    );
  }

  /* --------------------------------------------------------------- editor */
  if (routeId !== "new" && !selectedProduct) {
    return (
      <div className="p-10 text-center text-sm text-slate-500">
        {loading ? (
          <>
            <Loader2 size={18} className="mr-2 inline animate-spin" aria-hidden="true" /> Loading…
          </>
        ) : (
          <>
            This product no longer exists.{" "}
            <button type="button" onClick={() => navigate("/products")} className="font-semibold text-accent hover:underline">
              Back to products
            </button>
          </>
        )}
      </div>
    );
  }

  const categoryOptions = draft.category && !categories.includes(draft.category) ? [...categories, draft.category] : categories;

  return (
    <>
      <Breadcrumb backLabel="Products" onBack={() => navigate("/products")} current={draft.name || "New product"} dirty={dirty} />
      <EditorLayout
        main={
          <>
            <input
              value={draft.name}
              onChange={(e) => onNameChange(e.target.value)}
              maxLength={140}
              placeholder="Product name"
              aria-label="Product name"
              className="h-14 w-full rounded-md border border-slate-300 bg-white px-4 font-display text-2xl font-bold text-slate-900 shadow-sm placeholder:text-slate-300 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <p className="-mt-4 text-xs text-slate-500">
              Web address: www.fotolaminate.com/products/
              <input
                value={draft.slug}
                onChange={(e) => update("slug", slugify(e.target.value))}
                className="ml-0.5 min-w-[12rem] border-b border-dashed border-slate-300 bg-transparent px-0.5 text-slate-700 focus:border-accent focus:outline-none"
                aria-label="Web address"
              />
            </p>

            <Panel title="Description">
              <RichTextEditor value={draft.description} onChange={(html) => update("description", html)} placeholder="Product description" />
            </Panel>

            <Panel title="Short summary & key features">
              <Field label="Short summary" hint="Shown on product cards and in search results if no SEO description is set.">
                <textarea value={draft.summary} onChange={(e) => update("summary", e.target.value)} rows={2} className={textareaCls} />
              </Field>
              <Field label="Key features" hint="Separate features with commas.">
                <input value={draft.features} onChange={(e) => update("features", e.target.value)} className={inputCls} placeholder="Auto feeding, Variable speed, Heavy-duty rollers" />
              </Field>
            </Panel>

            <Panel title="Specifications">
              <SpecsEditor value={draft.specsJson} onChange={(json) => update("specsJson", json)} />
            </Panel>

            <Panel title="Gallery & video">
              <GalleryField value={draft.galleryUrls} onChange={(v) => update("galleryUrls", v)} />
              <Field label="Product video" hint="A YouTube embed link (https://www.youtube.com/embed/…) or a direct .mp4 link. Leave empty to hide the video.">
                <input value={draft.videoUrl} onChange={(e) => update("videoUrl", e.target.value)} className={inputCls} placeholder="https://www.youtube.com/embed/VIDEO_ID" />
              </Field>
            </Panel>

            <Panel title="SEO">
              <SeoPreview title={draft.metaTitle || draft.name} description={draft.metaDescription || draft.summary} path={`/products/${draft.slug}`} />
              <Field label="SEO title" counter={{ value: draft.metaTitle.trim().length, ideal: [50, 60] }} hint="Uses the product name if empty.">
                <input value={draft.metaTitle} onChange={(e) => update("metaTitle", e.target.value)} className={inputCls} />
              </Field>
              <Field label="SEO description" counter={{ value: draft.metaDescription.trim().length, ideal: [140, 160] }}>
                <textarea value={draft.metaDescription} onChange={(e) => update("metaDescription", e.target.value)} rows={3} className={textareaCls} />
              </Field>
              <Field label="Keywords" hint="Separate with commas.">
                <input value={draft.keywordString} onChange={(e) => update("keywordString", e.target.value)} className={inputCls} />
              </Field>
            </Panel>

            <Panel title="FAQs">
              <FaqField faqs={draft.faqs} onChange={(faqs) => update("faqs", faqs)} label="Questions shown on the product page" />
            </Panel>
          </>
        }
        sidebar={
          <>
            <PublishBox
              published={draft.published}
              onPublishedChange={(v) => update("published", v)}
              updatedAt={selectedProduct?.updated_at}
              isNew={!draft.id}
              viewHref={draft.id && draft.slug ? `/products/${draft.slug}` : undefined}
              onSave={() => void save()}
              saving={saving}
              onDelete={
                draft.id
                  ? () =>
                      void removeProduct({ id: draft.id as string, name: draft.name }).then((ok) => {
                        if (ok) navigate("/products");
                      })
                  : undefined
              }
            />
            <MetaBox title="Category">
              <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                {categoryOptions.map((c) => (
                  <label key={c} className="flex cursor-pointer items-center gap-2 text-slate-700">
                    <input type="radio" name="product-category" checked={draft.category === c} onChange={() => update("category", c)} />
                    {c}
                  </label>
                ))}
                {categoryOptions.length === 0 ? <p className="text-slate-500">No categories yet.</p> : null}
              </div>
              {newCategory === null ? (
                <button type="button" onClick={() => setNewCategory("")} className="text-sm font-medium text-accent hover:underline">
                  + New category
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newCategory.trim()) {
                        update("category", newCategory.trim());
                        setNewCategory(null);
                      }
                    }}
                    autoFocus
                    className={`${inputCls} h-9`}
                    placeholder="Category name"
                    aria-label="New category name"
                  />
                  <button
                    type="button"
                    disabled={!newCategory.trim()}
                    onClick={() => {
                      update("category", newCategory.trim());
                      setNewCategory(null);
                    }}
                    className="text-sm font-medium text-accent hover:underline disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
              )}
            </MetaBox>
            <MetaBox title="Main image">
              <ImageBox value={draft.coverImageUrl} onChange={(v) => update("coverImageUrl", v)} emptyHint="Drop the product photo here, or use Upload below" />
            </MetaBox>
            <MetaBox title="Social sharing image">
              <ImageBox value={draft.ogImageUrl} onChange={(v) => update("ogImageUrl", v)} emptyHint="Optional — uses the main image if empty" />
            </MetaBox>
          </>
        }
      />
    </>
  );
};

export default ProductManager;
