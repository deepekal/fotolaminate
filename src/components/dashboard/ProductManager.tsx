"use client";

import { useEffect, useMemo, useState } from "react";
import { api, ProductRecord } from "@/lib/api";
import { slugify } from "@/lib/slug";
import { toast } from "sonner";
import {
  Card,
  EditorBody,
  EditorHeader,
  EmptyEditor,
  FaqField,
  Field,
  ImageField,
  ListPane,
  ListRow,
  ManagerLayout,
  SeoPreview,
  btnPrimary,
  confirmDiscard,
  inputCls,
  monoCls,
  textareaCls,
  useSaveShortcut,
  useUnloadWarning,
} from "@/components/dashboard/admin-ui";
import { Plus } from "lucide-react";

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


const ProductManager = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(() => emptyDraft());
  const [uploadingCover, setUploadingCover] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  // Editor is open for an existing product or a new one; on mobile this switches panes.
  const [editing, setEditing] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedId) ?? null,
    [products, selectedId],
  );

  const baseline = useMemo(() => (selectedProduct ? toDraft(selectedProduct) : emptyDraft()), [selectedProduct]);
  const dirty = editing && JSON.stringify(draft) !== JSON.stringify(baseline);
  useUnloadWarning(dirty);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => (p.category ?? "").trim()).filter(Boolean))).sort(),
    [products],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || (p.category ?? "").toLowerCase().includes(q));
  }, [products, search]);

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

  useEffect(() => {
    if (selectedProduct) setDraft(toDraft(selectedProduct));
  }, [selectedProduct]);

  function update<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function openProduct(id: string) {
    if (id === selectedId && editing) return;
    if (!confirmDiscard(dirty)) return;
    setSelectedId(id);
    setEditing(true);
  }

  function newProduct() {
    if (!confirmDiscard(dirty)) return;
    setSelectedId(null);
    setDraft(emptyDraft());
    setEditing(true);
  }

  function backToList() {
    if (!confirmDiscard(dirty)) return;
    if (selectedProduct) setDraft(toDraft(selectedProduct));
    setEditing(false);
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
      if (!draft.slug.trim()) throw new Error("Slug is required");

      let specs: unknown;
      try {
        specs = JSON.parse(draft.specsJson || "{}");
      } catch {
        throw new Error("Specifications must be valid JSON — check the Advanced section.");
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
        toast.success("Product saved");
      } else {
        const created = await api.products.create(payload);
        toast.success("Product created");
        setSelectedId(created.id);
      }

      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  useSaveShortcut(() => void save(), editing);

  async function remove() {
    if (!draft.id) return;
    const ok = window.confirm(`Delete "${draft.name}"? This can't be undone.`);
    if (!ok) return;

    try {
      await api.products.remove(draft.id);
      toast.success("Product deleted");
      setSelectedId(null);
      setDraft(emptyDraft());
      setEditing(false);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete product");
    }
  }

  async function uploadCover(file: File) {
    try {
      setUploadingCover(true);
      const { url } = await api.uploads.imgbb(file);
      update("coverImageUrl", url);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingCover(false);
    }
  }

  const list = (
    <ListPane
      title="Products"
      count={filtered.length}
      search={search}
      onSearch={setSearch}
      onNew={newProduct}
      newLabel="New product"
      loading={loading}
      emptyText={products.length === 0 ? "No products yet. Create your first one." : "No products match your search."}
    >
      {filtered.map((p) => (
        <ListRow
          key={p.id}
          active={editing && p.id === selectedId}
          onClick={() => openProduct(p.id)}
          title={p.name}
          meta={p.category ?? "No category"}
          thumb={p.cover_image_url}
          published={p.published}
        />
      ))}
    </ListPane>
  );

  const editor = !editing ? (
    <EmptyEditor
      title="Select a product"
      text="Choose a product from the list to edit it, or create a new one."
      action={
        <button type="button" onClick={newProduct} className={btnPrimary}>
          <Plus size={16} aria-hidden="true" /> New product
        </button>
      }
    />
  ) : (
    <div>
      <EditorHeader
        kicker={draft.id ? "Edit product" : "New product"}
        title={draft.name || "Untitled product"}
        dirty={dirty}
        published={draft.published}
        onPublishedChange={(v) => update("published", v)}
        viewHref={draft.id && draft.slug.trim() ? `/products/${draft.slug}` : undefined}
        onDelete={draft.id ? remove : undefined}
        onSave={() => void save()}
        saving={saving}
        saveLabel={draft.id ? "Save changes" : "Create product"}
        onBack={backToList}
      />
      <EditorBody>
        <Card title="Basics" description="Name, web address and where it appears on the site.">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Product name">
              <input value={draft.name} onChange={(e) => onNameChange(e.target.value)} maxLength={140} className={inputCls} placeholder="e.g. CL-420 Auto (Fully Auto)" />
            </Field>
            <Field label="Web address" hint={`www.fotolaminate.com/products/${draft.slug || "…"}`}>
              <input value={draft.slug} onChange={(e) => update("slug", slugify(e.target.value))} maxLength={140} className={inputCls} placeholder="product-slug" />
            </Field>
            <Field label="Category" hint="Pick an existing category to keep products grouped; a new name creates a new category.">
              <input value={draft.category} onChange={(e) => update("category", e.target.value)} list="product-categories" className={inputCls} placeholder="Cold Lamination Machine" />
              <datalist id="product-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Short summary" hint="Shown on product cards and listings.">
              <input value={draft.summary} onChange={(e) => update("summary", e.target.value)} className={inputCls} placeholder="One or two sentences" />
            </Field>
          </div>
        </Card>

        <Card title="Content" description="What visitors read on the product page.">
          <Field label="Description">
            <textarea value={draft.description} onChange={(e) => update("description", e.target.value)} rows={9} className={textareaCls} placeholder="Detailed product description" />
          </Field>
          <Field label="Key features" hint="Separate features with commas.">
            <input value={draft.features} onChange={(e) => update("features", e.target.value)} className={inputCls} placeholder="Auto feeding, Variable speed, Heavy-duty rollers" />
          </Field>
        </Card>

        <Card title="Images & video">
          <div className="grid gap-6 md:grid-cols-2">
            <ImageField
              label="Main image"
              value={draft.coverImageUrl}
              onChange={(v) => update("coverImageUrl", v)}
              onUpload={(f) => void uploadCover(f)}
              uploading={uploadingCover}
            />
            <ImageField
              label="Social sharing image"
              value={draft.ogImageUrl}
              onChange={(v) => update("ogImageUrl", v)}
              hint="Shown when the page is shared on WhatsApp or Facebook. Uses the main image if empty."
            />
          </div>
          <Field label="Gallery images" hint="Image addresses, separated by commas.">
            <input value={draft.galleryUrls} onChange={(e) => update("galleryUrls", e.target.value)} className={inputCls} placeholder="/images/a.jpg, /images/b.jpg" />
          </Field>
          <Field label="Product video" hint="A YouTube embed link (https://www.youtube.com/embed/…) or a direct .mp4 link. Leave empty to hide the video.">
            <input value={draft.videoUrl} onChange={(e) => update("videoUrl", e.target.value)} className={inputCls} placeholder="https://www.youtube.com/embed/VIDEO_ID" />
          </Field>
        </Card>

        <Card title="Search engine (SEO)" description="How this product appears in Google results.">
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
        </Card>

        <Card title="FAQs" description="Shown as questions and answers on the product page.">
          <FaqField faqs={draft.faqs} onChange={(faqs) => update("faqs", faqs)} label="Questions" />
        </Card>

        <Card title="Advanced" description="Technical specifications, stored as JSON.">
          <Field label="Specifications (JSON)" hint='Example: {"Machine Size": "30\" × 30\"", "Motor": "1.5 HP"}'>
            <textarea value={draft.specsJson} onChange={(e) => update("specsJson", e.target.value)} rows={9} className={monoCls} spellCheck={false} />
          </Field>
        </Card>
      </EditorBody>
    </div>
  );

  return <ManagerLayout list={list} editor={editor} showEditorOnMobile={editing} />;
};

export default ProductManager;
