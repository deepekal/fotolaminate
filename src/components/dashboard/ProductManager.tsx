"use client";

import { useEffect, useMemo, useState } from "react";
import { api, ProductRecord } from "@/lib/api";
import { slugify } from "@/lib/slug";
import { toast } from "sonner";
import Link from "next/link";

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

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedId) ?? null,
    [products, selectedId],
  );

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

  function onNameChange(name: string) {
    update("name", name);
    if (!draft.id && !draft.slug.trim()) {
      update("slug", slugify(name));
    }
  }

  function parseFaqJson(faqString: string): { q: string; a: string } {
    try {
      return JSON.parse(faqString);
    } catch {
      return { q: "", a: "" };
    }
  }

  function faqToJson(faq: { q: string; a: string }): string {
    return JSON.stringify(faq, null, 2);
  }

  function updateFAQQuestion(faqIndex: number, question: string) {
    const nextFaqs = draft.faqs.map((faq, index) => {
      if (index !== faqIndex) return faq;
      const parsed = parseFaqJson(faq);
      return faqToJson({ ...parsed, q: question });
    });
    update("faqs", nextFaqs);
  }

  function updateFAQAnswer(faqIndex: number, answer: string) {
    const nextFaqs = draft.faqs.map((faq, index) => {
      if (index !== faqIndex) return faq;
      const parsed = parseFaqJson(faq);
      return faqToJson({ ...parsed, a: answer });
    });
    update("faqs", nextFaqs);
  }

  async function save() {
    try {
      if (!draft.name.trim()) throw new Error("Name is required");
      if (!draft.slug.trim()) throw new Error("Slug is required");

      const specs = JSON.parse(draft.specsJson || "{}");

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
      } else {
        const created = await api.products.create(payload);
        toast.success("Product created");
        setSelectedId(created.id);
      }

      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save product");
    }
  }

  async function remove() {
    if (!draft.id) return;
    const ok = window.confirm("Delete this product?");
    if (!ok) return;

    try {
      await api.products.remove(draft.id);
      toast.success("Product deleted");
      setSelectedId(null);
      setDraft(emptyDraft());
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

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-foreground">Products</h2>
          <button
            type="button"
            onClick={() => {
              setSelectedId(null);
              setDraft(emptyDraft());
            }}
            className="rounded-md border border-border bg-muted px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-accent"
          >
            Create new
          </button>
        </div>

        <input
          type="search"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
        />

        <div className="space-y-3">
          {loading ? (
            <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">Loading…</div>
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
              No products yet.
            </div>
          ) : (
            products
              .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase()))
              .map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={`w-full rounded-lg border p-4 text-left shadow-industrial transition-colors ${
                  p.id === selectedId ? "border-accent bg-card" : "border-border bg-muted hover:border-accent/50"
                }`}
              >
                <div className="mb-1 font-display text-base font-bold text-foreground">{p.name}</div>
                <div className="text-xs text-muted-foreground">/products/{p.slug}</div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="lg:col-span-8">
        <div className="mb-4 rounded-lg border border-border bg-muted p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-display text-lg font-bold text-foreground">Product editor</div>
              <div className="text-xs text-muted-foreground">Create and update product pages dynamically.</div>
            </div>

            <div className="flex items-center gap-3">
              {draft.slug.trim() && (
                <Link
                  href={`/products/${draft.slug}`}
                  className="rounded-md border border-border bg-card px-4 py-2 text-sm font-bold text-foreground transition-colors hover:border-accent"
                >
                  View
                </Link>
              )}

              <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <input
                  type="checkbox"
                  checked={draft.published}
                  onChange={(e) => update("published", e.target.checked)}
                />
                Published
              </label>

              <button
                type="button"
                onClick={save}
                className="rounded-md gradient-accent px-4 py-2 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90"
              >
                {draft.id ? "Update Product" : "Create Product"}
              </button>
              {draft.id && (
                <button
                  type="button"
                  onClick={remove}
                  className="rounded-md border border-border bg-card px-4 py-2 text-sm font-bold text-foreground transition-colors hover:border-destructive hover:text-destructive"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Name</label>
              <input
                value={draft.name}
                onChange={(e) => onNameChange(e.target.value)}
                maxLength={140}
                className="w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                placeholder="Product name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Slug</label>
              <input
                value={draft.slug}
                onChange={(e) => update("slug", slugify(e.target.value))}
                maxLength={140}
                className="w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                placeholder="product-slug"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Category</label>
              <input
                value={draft.category}
                onChange={(e) => update("category", e.target.value)}
                className="w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                placeholder="Photo Lamination Machines"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Summary</label>
              <input
                value={draft.summary}
                onChange={(e) => update("summary", e.target.value)}
                className="w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                placeholder="Short summary shown on listing cards"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">SEO Title</label>
              <input
                value={draft.metaTitle}
                onChange={(e) => update("metaTitle", e.target.value)}
                className="w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                placeholder="Meta title"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">SEO Keywords</label>
              <input
                value={draft.keywordString}
                onChange={(e) => update("keywordString", e.target.value)}
                className="w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                placeholder="Comma separated keywords"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">SEO Description</label>
            <textarea
              value={draft.metaDescription}
              onChange={(e) => update("metaDescription", e.target.value)}
              rows={2}
              className="w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
              placeholder="Meta description"
            />
          </div>

          <hr className="my-6 border-border" />

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Description</label>
            <textarea
              value={draft.description}
              onChange={(e) => update("description", e.target.value)}
              rows={6}
              className="w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
              placeholder="Detailed product description"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Features</label>
            <input
              value={draft.features}
              onChange={(e) => update("features", e.target.value)}
              className="w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
              placeholder="Comma-separated"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Specs (JSON)</label>
            <textarea
              value={draft.specsJson}
              onChange={(e) => update("specsJson", e.target.value)}
              rows={8}
              className="w-full rounded-md border border-border bg-muted px-4 py-3 font-mono text-xs text-foreground focus:border-accent focus:outline-none"
              placeholder='{"laminationWidth":"360mm","motorPower":"1.5 HP"}'
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Cover Image URL</label>
              <input
                value={draft.coverImageUrl}
                onChange={(e) => update("coverImageUrl", e.target.value)}
                className="w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                placeholder="https://"
              />
              <div className="mt-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Or upload an image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadCover(f);
                    }}
                    className="mt-2 block w-full text-xs"
                    disabled={uploadingCover}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">OG Image URL</label>
              <input
                value={draft.ogImageUrl}
                onChange={(e) => update("ogImageUrl", e.target.value)}
                className="w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                placeholder="https://"
              />
              <div className="mt-1 text-xs text-muted-foreground">If empty, uses cover image.</div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Gallery Image URLs</label>
            <input
              value={draft.galleryUrls}
              onChange={(e) => update("galleryUrls", e.target.value)}
              className="w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
              placeholder="Comma-separated"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Product Video URL</label>
            <input
              value={draft.videoUrl}
              onChange={(e) => update("videoUrl", e.target.value)}
              className="w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
              placeholder="https://www.youtube.com/embed/VIDEO_ID or direct video URL"
            />
            <div className="mt-1 text-xs text-muted-foreground">
              Paste a YouTube embed URL (e.g. https://www.youtube.com/embed/…) or a direct .mp4 link. Leave empty to hide the video section.
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-semibold text-foreground">FAQs</label>
              <button
                type="button"
                onClick={() => update("faqs", [...draft.faqs, JSON.stringify({ q: "", a: "" }, null, 2)])}
                className="rounded-md border border-border bg-muted px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-accent"
              >
                + Add FAQ
              </button>
            </div>

            {draft.faqs.length === 0 ? (
              <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
                No FAQs added yet. Click the + Add FAQ button to add a frequently asked question.
              </div>
            ) : (
              <div className="space-y-3">
                {draft.faqs.map((faq, i) => {
                  const parsed = parseFaqJson(faq);
                  return (
                    <div key={i} className="rounded-lg border border-border bg-card p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="text-xs font-semibold text-muted-foreground">FAQ {i + 1}</div>
                        <button
                          type="button"
                          onClick={() => update("faqs", draft.faqs.filter((_, idx) => idx !== i))}
                          className="text-xs font-semibold text-destructive hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-foreground">Question</label>
                          <input
                            type="text"
                            value={parsed.q}
                            onChange={(e) => updateFAQQuestion(i, e.target.value)}
                            className="w-full rounded-md border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                            placeholder="Enter question"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-foreground">Answer</label>
                          <textarea
                            value={parsed.a}
                            onChange={(e) => updateFAQAnswer(i, e.target.value)}
                            rows={3}
                            className="w-full rounded-md border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                            placeholder="Enter answer"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-2 text-xs text-muted-foreground">
              Add FAQs. Each FAQ will be displayed in an accordion on the product page.
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={save}
              className="rounded-md gradient-accent px-5 py-3 font-display text-sm font-bold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90"
            >
              {draft.id ? "Update Product" : "Create Product"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductManager;
