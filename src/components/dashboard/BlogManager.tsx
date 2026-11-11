"use client";

import { useEffect, useMemo, useState } from "react";
import { api, BlogPostRecord } from "@/lib/api";
import { slugify } from "@/lib/slug";
import { toast } from "sonner";
import {
  AdminTable,
  Breadcrumb,
  EditorLayout,
  FaqField,
  Field,
  ImageBox,
  JsonListEditor,
  MetaBox,
  PageTitle,
  Panel,
  PublishBox,
  SeoPreview,
  StatusBadge,
  TitleCell,
  btnPrimary,
  formatDate,
  inputCls,
  textareaCls,
  useSaveShortcut,
  useUnloadWarning,
} from "@/components/dashboard/admin-ui";
import RichTextEditor from "@/components/dashboard/RichTextEditor";
import { useConfirm } from "@/components/dashboard/confirm";
import { stripHtml } from "@/lib/rich-text";
import { Loader2, Plus } from "lucide-react";

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

/** Full record → API payload (the update endpoint replaces every field). */
function recordToPayload(r: BlogPostRecord, overrides: Partial<BlogPostRecord> = {}) {
  return {
    title: r.title,
    slug: r.slug,
    meta_title: r.meta_title,
    meta_description: r.meta_description,
    tags: r.tags ?? [],
    keywords: r.keywords ?? [],
    schemas: Array.isArray(r.schemas) ? r.schemas : [],
    cover_image_url: r.cover_image_url,
    og_image_url: r.og_image_url,
    content: r.content ?? "",
    faqs: Array.isArray(r.faqs) ? r.faqs : [],
    published: r.published,
    ...overrides,
  };
}

type SectionProps = {
  routeId?: string;
  navigate: (hash: string) => void;
  onDirtyChange: (dirty: boolean) => void;
};

const BlogManager = ({ routeId, navigate, onDirtyChange }: SectionProps) => {
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<BlogPostRecord[]>([]);
  const [draft, setDraft] = useState<BlogDraft>(() => emptyDraft());
  // The list endpoint returns an excerpt only; the editor loads the full post.
  const [fullPost, setFullPost] = useState<BlogPostRecord | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");

  const editing = routeId !== undefined;
  const listItem = useMemo(() => (routeId && routeId !== "new" ? posts.find((p) => p.id === routeId) ?? null : null), [posts, routeId]);

  const baseline = useMemo(() => (fullPost ? toDraft(fullPost) : emptyDraft()), [fullPost]);
  const dirty = editing && !loadingPost && JSON.stringify(draft) !== JSON.stringify(baseline);
  useUnloadWarning(dirty);
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  const counts = useMemo(
    () => ({ all: posts.length, published: posts.filter((p) => p.published).length, draft: posts.filter((p) => !p.published).length }),
    [posts],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter(
      (p) => (status === "all" || (status === "published") === p.published) && (!q || p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)),
    );
  }, [posts, search, status]);

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

  // Load the full post for the editor.
  const listSlug = listItem?.slug;
  useEffect(() => {
    if (routeId === "new") {
      setFullPost(null);
      setDraft(emptyDraft());
      return;
    }
    if (!listSlug) return;
    let active = true;
    setLoadingPost(true);
    api.blogs
      .getBySlug(listSlug)
      .then((p) => {
        if (!active) return;
        setFullPost(p);
        setDraft(toDraft(p));
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load post"))
      .finally(() => active && setLoadingPost(false));
    return () => {
      active = false;
    };
  }, [routeId, listSlug]);

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
    if (saving || loadingPost) return;
    setSaving(true);
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
      if (!payload.slug.trim()) throw new Error("Web address is required");

      if (draft.id) {
        const saved = await api.blogs.update(draft.id, payload);
        setFullPost(saved);
        setDraft(toDraft(saved));
        toast.success("Post updated");
        await refresh();
      } else {
        const created = await api.blogs.create(payload);
        toast.success("Post created");
        await refresh();
        navigate(`/blogs/${created.id}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save post");
    } finally {
      setSaving(false);
    }
  }

  useSaveShortcut(() => void save(), editing);

  async function removePost(p: Pick<BlogPostRecord, "id" | "title">) {
    const ok = await confirm({
      title: `Delete "${p.title}"?`,
      description: "The post will be removed from the website permanently. This can't be undone.",
      confirmLabel: "Delete post",
    });
    if (!ok) return false;
    try {
      await api.blogs.remove(p.id);
      toast.success("Post deleted");
      await refresh();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete post");
      return false;
    }
  }

  async function bulk(action: string, ids: string[]) {
    const targets = posts.filter((p) => ids.includes(p.id));
    if (
      action === "delete" &&
      !(await confirm({
        title: `Delete ${targets.length} post${targets.length === 1 ? "" : "s"}?`,
        description: (
          <>
            {targets.slice(0, 5).map((t) => t.title).join(", ")}
            {targets.length > 5 ? ` and ${targets.length - 5} more` : ""}. They will be removed from the website permanently. This can't be undone.
          </>
        ),
        confirmLabel: `Delete ${targets.length}`,
      }))
    )
      return;
    let done = 0;
    for (const p of targets) {
      try {
        if (action === "delete") await api.blogs.remove(p.id);
        else {
          // Fetch the full post first so the article content is kept.
          const full = await api.blogs.getBySlug(p.slug);
          await api.blogs.update(p.id, recordToPayload(full, { published: action === "publish" }));
        }
        done++;
      } catch {
        // continue; reported below
      }
    }
    if (done === targets.length) toast.success(`${done} post(s) updated`);
    else toast.error(`${done} of ${targets.length} updated — some failed`);
    await refresh();
  }

  /* ---------------------------------------------------------------- table */
  if (!editing) {
    return (
      <>
        <PageTitle
          title="Blog posts"
          actions={
            <button type="button" onClick={() => navigate("/blogs/new")} className={btnPrimary}>
              <Plus size={16} aria-hidden="true" /> Add post
            </button>
          }
        />
        <AdminTable
          rows={rows}
          loading={loading}
          columns={[{ label: "Title" }, { label: "Status", className: "w-28" }, { label: "Published on", className: "w-36" }, { label: "Updated", className: "w-32" }]}
          emptyText={posts.length === 0 ? "No posts yet." : "No posts match these filters."}
          statusCounts={counts}
          status={status}
          onStatus={setStatus}
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search posts"
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
                title={p.title}
                onEdit={() => navigate(`/blogs/${p.id}`)}
                viewHref={p.published ? `/blogs/${p.slug}` : undefined}
                extra={[{ label: "Delete", danger: true, onClick: () => void removePost(p) }]}
              />
              <td className="py-2.5 pr-4">
                <StatusBadge published={p.published} />
              </td>
              <td className="py-2.5 pr-4 text-slate-500">{formatDate(p.created_at)}</td>
              <td className="py-2.5 pr-4 text-slate-500">{formatDate(p.updated_at)}</td>
            </>
          )}
        />
      </>
    );
  }

  /* --------------------------------------------------------------- editor */
  if (routeId !== "new" && (!listItem || (loadingPost && !fullPost))) {
    return (
      <div className="p-10 text-center text-sm text-slate-500">
        {loading || loadingPost ? (
          <>
            <Loader2 size={18} className="mr-2 inline animate-spin" aria-hidden="true" /> Loading…
          </>
        ) : (
          <>
            This post no longer exists.{" "}
            <button type="button" onClick={() => navigate("/blogs")} className="font-semibold text-accent hover:underline">
              Back to posts
            </button>
          </>
        )}
      </div>
    );
  }

  const words = stripHtml(draft.content).split(" ").filter(Boolean).length;

  return (
    <>
      <Breadcrumb backLabel="Blog posts" onBack={() => navigate("/blogs")} current={draft.title || "New post"} dirty={dirty} />
      <EditorLayout
        main={
          <>
            <input
              value={draft.title}
              onChange={(e) => onTitleChange(e.target.value)}
              maxLength={140}
              placeholder="Post title"
              aria-label="Post title"
              className="h-14 w-full rounded-md border border-slate-300 bg-white px-4 font-display text-2xl font-bold text-slate-900 shadow-sm placeholder:text-slate-300 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <p className="-mt-4 text-xs text-slate-500">
              Web address: www.fotolaminate.com/blogs/
              <input
                value={draft.slug}
                onChange={(e) => update("slug", slugify(e.target.value))}
                className="ml-0.5 min-w-[12rem] border-b border-dashed border-slate-300 bg-transparent px-0.5 text-slate-700 focus:border-accent focus:outline-none"
                aria-label="Web address"
              />
            </p>

            <Panel title="Article" actions={<span className="text-xs text-slate-500">{words} words · about {Math.max(1, Math.round(words / 200))} min read</span>}>
              <RichTextEditor value={draft.content} onChange={(html) => update("content", html)} placeholder="Write the article" minHeight={420} />
            </Panel>

            <Panel title="SEO">
              <SeoPreview title={draft.metaTitle || draft.title} description={draft.metaDescription} path={`/blogs/${draft.slug}`} />
              <Field label="SEO title" counter={{ value: draft.metaTitle.trim().length, ideal: [50, 60] }} hint="Uses the post title if empty.">
                <input value={draft.metaTitle} onChange={(e) => update("metaTitle", e.target.value)} maxLength={80} className={inputCls} />
              </Field>
              <Field label="SEO description" counter={{ value: draft.metaDescription.trim().length, ideal: [140, 160] }}>
                <textarea value={draft.metaDescription} onChange={(e) => update("metaDescription", e.target.value)} rows={3} maxLength={200} className={textareaCls} />
              </Field>
              <Field label="Keywords" hint="Separate with commas. Uses the tags if empty.">
                <input value={draft.keywords} onChange={(e) => update("keywords", e.target.value)} className={inputCls} />
              </Field>
            </Panel>

            <Panel title="FAQs">
              <FaqField faqs={draft.faqs} onChange={(faqs) => update("faqs", faqs)} label="Questions shown at the end of the post" />
            </Panel>

            <Panel title="Structured data (advanced)">
              <JsonListEditor
                items={draft.schemas}
                onChange={(schemas) => update("schemas", schemas)}
                addLabel="Add schema"
                emptyText="No structured data added. Optional."
                placeholder="Paste JSON or a JSON-LD <script> block"
              />
            </Panel>
          </>
        }
        sidebar={
          <>
            <PublishBox
              published={draft.published}
              onPublishedChange={(v) => update("published", v)}
              updatedAt={fullPost?.updated_at}
              isNew={!draft.id}
              viewHref={draft.id && draft.slug ? `/blogs/${draft.slug}` : undefined}
              onSave={() => void save()}
              saving={saving}
              onDelete={
                draft.id
                  ? () =>
                      void removePost({ id: draft.id as string, title: draft.title }).then((ok) => {
                        if (ok) {
                          // The item is gone, so its unsaved edits are moot — don't warn.
                          onDirtyChange(false);
                          navigate("/blogs");
                        }
                      })
                  : undefined
              }
            />
            <MetaBox title="Tags">
              <input value={draft.tags} onChange={(e) => update("tags", e.target.value)} className={inputCls} placeholder="Cold lamination, Maintenance" aria-label="Tags" />
              <p className="text-xs text-slate-500">Separate with commas.</p>
            </MetaBox>
            <MetaBox title="Cover image">
              <ImageBox value={draft.coverImageUrl} onChange={(v) => update("coverImageUrl", v)} emptyHint="Drop the cover photo here, or use Upload below" />
            </MetaBox>
            <MetaBox title="Social sharing image">
              <ImageBox value={draft.ogImageUrl} onChange={(v) => update("ogImageUrl", v)} emptyHint="Optional — uses the cover image if empty" />
            </MetaBox>
          </>
        }
      />
    </>
  );
};

export default BlogManager;
