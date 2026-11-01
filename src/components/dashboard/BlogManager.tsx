"use client";

import { useEffect, useMemo, useState } from "react";
import { api, BlogPostRecord } from "@/lib/api";
import { slugify } from "@/lib/slug";
import { toast } from "sonner";
import Link from "next/link";

type BlogDraft = {
  id?: string;
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  tags: string;
  keywords: string;
  schemas: string[];
  coverImageUrl: string;
  ogImageUrl: string;
  content: string;
  faqs: string[];
  published: boolean;
};

function splitCommaList(input: string) {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toDraft(record: BlogPostRecord): BlogDraft {
  return {
    id: record.id,
    title: record.title,
    slug: record.slug,
    metaTitle: record.meta_title ?? "",
    metaDescription: record.meta_description ?? "",
    tags: (record.tags ?? []).join(", "),
    keywords: (record.keywords ?? []).join(", "),
    schemas: Array.isArray(record.schemas) ? record.schemas.map((s) => JSON.stringify(s, null, 2)) : [],
    coverImageUrl: record.cover_image_url ?? "",
    ogImageUrl: record.og_image_url ?? "",
    content: record.content ?? "",
    faqs: Array.isArray(record.faqs) ? record.faqs.map((faq) => JSON.stringify(faq, null, 2)) : [],
    published: record.published ?? true,
  };
}

function emptyDraft(): BlogDraft {
  return {
    title: "",
    slug: "",
    metaTitle: "",
    metaDescription: "",
    tags: "",
    keywords: "",
    schemas: [],
    coverImageUrl: "",
    ogImageUrl: "",
    content: "",
    faqs: [],
    published: true,
  };
}

function parseSchemaInput(input: string): unknown {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Schema cannot be empty");

  if (trimmed.startsWith("<script")) {
    const start = trimmed.indexOf(">") + 1;
    const end = trimmed.lastIndexOf("</script>");
    if (start <= 0 || end <= start) throw new Error("Invalid <script> block");
    const inner = trimmed.slice(start, end).trim();
    return JSON.parse(inner);
  }

  return JSON.parse(trimmed);
}

const BlogManager = () => {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<BlogPostRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BlogDraft>(() => emptyDraft());
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingOg, setUploadingOg] = useState(false);
  const [search, setSearch] = useState("");

  const selectedPost = useMemo(
    () => posts.find((p) => p.id === selectedId) ?? null,
    [posts, selectedId],
  );

  async function refresh() {
    setLoading(true);
    try {
      const list = await api.blogs.list();
      setPosts(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (selectedPost) setDraft(toDraft(selectedPost));
  }, [selectedPost]);

  const seoTitleHint = useMemo(() => {
    const len = draft.metaTitle.trim().length;
    if (len === 0) return "If empty, uses the main title.";
    return `${len} characters`;
  }, [draft.metaTitle]);

  const seoDescriptionHint = useMemo(() => {
    const len = draft.metaDescription.trim().length;
    if (len === 0) return "150-160 characters recommended.";
    return `${len} characters`;
  }, [draft.metaDescription]);

  function update<K extends keyof BlogDraft>(key: K, value: BlogDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function onTitleChange(title: string) {
    update("title", title);
    if (!draft.id && !draft.slug.trim()) {
      update("slug", slugify(title));
    }
  }

  async function save() {
    try {
      const schemasParsed = draft.schemas
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => parseSchemaInput(s));

      const faqsParsed = draft.faqs
        .map((f) => {
          try {
            return JSON.parse(f);
          } catch {
            return null;
          }
        })
        .filter((v): v is { q: string; a: string } => v !== null && typeof v.q === "string" && typeof v.a === "string");

      const tags = splitCommaList(draft.tags);
      const keywords = draft.keywords.trim() ? splitCommaList(draft.keywords) : tags;

      const payload = {
        title: draft.title,
        slug: draft.slug,
        meta_title: draft.metaTitle.trim() || null,
        meta_description: draft.metaDescription.trim() || null,
        tags,
        keywords,
        schemas: schemasParsed,
        cover_image_url: draft.coverImageUrl.trim() || null,
        og_image_url: (draft.ogImageUrl.trim() || draft.coverImageUrl.trim()) || null,
        content: draft.content,
        faqs: faqsParsed,
        published: draft.published,
      };

      if (!payload.title.trim()) throw new Error("Title is required");
      if (!payload.slug.trim()) throw new Error("Slug is required");

      if (draft.id) {
        await api.blogs.update(draft.id, payload);
        toast.success("Post updated");
      } else {
        const created = await api.blogs.create(payload);
        toast.success("Post created");
        setSelectedId(created.id);
      }

      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save post");
    }
  }

  async function remove() {
    if (!draft.id) return;
    const ok = window.confirm("Delete this post?");
    if (!ok) return;

    try {
      await api.blogs.remove(draft.id);
      toast.success("Post deleted");
      setSelectedId(null);
      setDraft(emptyDraft());
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete post");
    }
  }

  async function uploadImage(file: File, kind: "cover" | "og") {
    try {
      if (kind === "cover") setUploadingCover(true);
      if (kind === "og") setUploadingOg(true);

      const { url } = await api.uploads.imgbb(file);
      if (kind === "cover") update("coverImageUrl", url);
      if (kind === "og") update("ogImageUrl", url);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      if (kind === "cover") setUploadingCover(false);
      if (kind === "og") setUploadingOg(false);
    }
  }

  function addSchema() {
    update("schemas", [...draft.schemas, "{"]);
  }

  function updateSchema(index: number, value: string) {
    const next = [...draft.schemas];
    next[index] = value;
    update("schemas", next);
  }

  function removeSchema(index: number) {
    const next = draft.schemas.filter((_, i) => i !== index);
    update("schemas", next);
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

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-foreground">Posts</h2>
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
          placeholder="Search posts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
        />

        <div className="space-y-3">
          {loading ? (
            <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">Loading…</div>
          ) : posts.length === 0 ? (
            <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
              No posts yet.
            </div>
          ) : (
            posts
              .filter((p) => p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase()))
              .map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={`w-full rounded-lg border p-4 text-left shadow-industrial transition-colors ${
                  p.id === selectedId ? "border-accent bg-card" : "border-border bg-muted hover:border-accent/50"
                }`}
              >
                <div className="mb-1 font-display text-base font-bold text-foreground">{p.title}</div>
                <div className="text-xs text-muted-foreground">/{p.slug}</div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="lg:col-span-8">
        <div className="mb-4 rounded-lg border border-border bg-muted p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-display text-lg font-bold text-foreground">Create Post</div>
              <div className="text-xs text-muted-foreground">
                Use the editor below to manage the blog content that powers every site.
              </div>
            </div>

            <div className="flex items-center gap-3">
              {draft.slug.trim() && (
                <Link
                  href={`/blogs/${draft.slug}`}
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
                {draft.id ? "Update Post" : "Create Post"}
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
              <label className="mb-2 block text-sm font-semibold text-foreground">Title</label>
              <input
                value={draft.title}
                onChange={(e) => onTitleChange(e.target.value)}
                maxLength={140}
                className="w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                placeholder="Post title"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Slug</label>
              <input
                value={draft.slug}
                onChange={(e) => update("slug", slugify(e.target.value))}
                maxLength={140}
                className="w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                placeholder="my-post-slug"
              />
              <div className="mt-1 text-xs text-muted-foreground">Auto-generated from the title, but you can override it.</div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Meta Title (SEO)</label>
            <input
              value={draft.metaTitle}
              onChange={(e) => update("metaTitle", e.target.value)}
              maxLength={80}
              className="w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
              placeholder="50-60 characters recommended"
            />
            <div className="mt-1 text-xs text-muted-foreground">Optimized title for search engines (50-60 chars). {seoTitleHint}</div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Meta Description (SEO)</label>
            <textarea
              value={draft.metaDescription}
              onChange={(e) => update("metaDescription", e.target.value)}
              rows={3}
              maxLength={200}
              className="w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
              placeholder="150-160 characters recommended"
            />
            <div className="mt-1 text-xs text-muted-foreground">Brief summary for search results and social media. {seoDescriptionHint}</div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Tags</label>
              <input
                value={draft.tags}
                onChange={(e) => update("tags", e.target.value)}
                className="w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                placeholder="marketing, release, seo"
              />
              <div className="mt-1 text-xs text-muted-foreground">Comma-separated. Used for filtering and related posts.</div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Keywords (SEO)</label>
              <input
                value={draft.keywords}
                onChange={(e) => update("keywords", e.target.value)}
                className="w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                placeholder="design courses, UI UX, interior design"
              />
              <div className="mt-1 text-xs text-muted-foreground">Comma-separated. Defaults to tags if empty.</div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-semibold text-foreground">Structured Data Schemas (JSON-LD)</label>
              <button
                type="button"
                onClick={addSchema}
                className="rounded-md border border-border bg-muted px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-accent"
              >
                + Add Schema
              </button>
            </div>

            {draft.schemas.length === 0 ? (
              <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
                No schemas added yet. Click the + Add Schema button to add structured data.
              </div>
            ) : (
              <div className="space-y-3">
                {draft.schemas.map((schema, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-xs font-semibold text-muted-foreground">Schema {i + 1}</div>
                      <button
                        type="button"
                        onClick={() => removeSchema(i)}
                        className="text-xs font-semibold text-destructive hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      value={schema}
                      onChange={(e) => updateSchema(i, e.target.value)}
                      rows={6}
                      className="w-full rounded-md border border-border bg-muted px-4 py-3 font-mono text-xs text-foreground focus:border-accent focus:outline-none"
                      placeholder='Paste JSON or a JSON-LD <script> block'
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-2 text-xs text-muted-foreground">
              Add multiple JSON-LD schemas (BlogPosting, FAQPage, etc.). Paste valid JSON or a single JSON-LD script
              block. Each entry renders as a separate script tag.
            </div>
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
              <div className="mt-2 flex items-center justify-between gap-3">
                <label className="text-xs font-semibold text-muted-foreground">
                  Or upload an image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadImage(f, "cover");
                    }}
                    className="mt-2 block w-full text-xs"
                    disabled={uploadingCover}
                  />
                </label>
                <div className="text-xs text-muted-foreground">Only JPEG, PNG, or WebP files are accepted.</div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">OG Image URL (Social Sharing)</label>
              <input
                value={draft.ogImageUrl}
                onChange={(e) => update("ogImageUrl", e.target.value)}
                className="w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                placeholder="https://"
              />
              <div className="mt-1 text-xs text-muted-foreground">Specific image for social media previews. If empty, uses cover image.</div>
              <div className="mt-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Or upload an image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadImage(f, "og");
                    }}
                    className="mt-2 block w-full text-xs"
                    disabled={uploadingOg}
                  />
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Content</label>
            <textarea
              value={draft.content}
              onChange={(e) => update("content", e.target.value)}
              rows={12}
              className="w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
              placeholder="Write the post content here"
            />
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
              Add FAQs. Each FAQ will be displayed in an accordion on the blog page.
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={save}
              className="rounded-md gradient-accent px-5 py-3 font-display text-sm font-bold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90"
            >
              {draft.id ? "Update Post" : "Create Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogManager;
