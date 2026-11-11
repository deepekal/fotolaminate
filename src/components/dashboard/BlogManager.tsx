"use client";

import { useEffect, useMemo, useState } from "react";
import { api, BlogPostRecord } from "@/lib/api";
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
  JsonListEditor,
  ListPane,
  ListRow,
  ManagerLayout,
  SeoPreview,
  btnPrimary,
  confirmDiscard,
  inputCls,
  textareaCls,
  useSaveShortcut,
  useUnloadWarning,
} from "@/components/dashboard/admin-ui";
import { Plus } from "lucide-react";

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
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const selectedPost = useMemo(
    () => posts.find((p) => p.id === selectedId) ?? null,
    [posts, selectedId],
  );

  // The list endpoint returns an excerpt, not full content; load the full post when one is opened.
  const [fullPost, setFullPost] = useState<BlogPostRecord | null>(null);
  const baseline = useMemo(() => (fullPost ? toDraft(fullPost) : emptyDraft()), [fullPost]);
  const dirty = editing && JSON.stringify(draft) !== JSON.stringify(baseline);
  useUnloadWarning(dirty);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return posts.filter((p) => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
  }, [posts, search]);

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
    if (!selectedPost) return;
    let active = true;
    // Show list data straight away, then replace with the full post (including content).
    setDraft(toDraft(selectedPost));
    api.blogs
      .getBySlug(selectedPost.slug)
      .then((p) => {
        if (!active) return;
        setFullPost(p);
        setDraft(toDraft(p));
      })
      .catch(() => {
        if (active) setFullPost(selectedPost);
      });
    return () => {
      active = false;
    };
  }, [selectedPost]);

  function update<K extends keyof BlogDraft>(key: K, value: BlogDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function openPost(id: string) {
    if (id === selectedId && editing) return;
    if (!confirmDiscard(dirty)) return;
    setFullPost(null);
    setSelectedId(id);
    setEditing(true);
  }

  function newPost() {
    if (!confirmDiscard(dirty)) return;
    setSelectedId(null);
    setFullPost(null);
    setDraft(emptyDraft());
    setEditing(true);
  }

  function backToList() {
    if (!confirmDiscard(dirty)) return;
    if (fullPost) setDraft(toDraft(fullPost));
    setEditing(false);
  }

  function onTitleChange(title: string) {
    update("title", title);
    if (!draft.id && !draft.slug.trim()) {
      update("slug", slugify(title));
    }
  }

  async function save() {
    if (saving) return;
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
      if (!payload.slug.trim()) throw new Error("Slug is required");

      if (draft.id) {
        const saved = await api.blogs.update(draft.id, payload);
        setFullPost(saved);
        toast.success("Post saved");
      } else {
        const created = await api.blogs.create(payload);
        setFullPost(created);
        toast.success("Post created");
        setSelectedId(created.id);
      }

      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save post");
    } finally {
      setSaving(false);
    }
  }

  useSaveShortcut(() => void save(), editing);

  async function remove() {
    if (!draft.id) return;
    const ok = window.confirm(`Delete "${draft.title}"? This can't be undone.`);
    if (!ok) return;

    try {
      await api.blogs.remove(draft.id);
      toast.success("Post deleted");
      setSelectedId(null);
      setFullPost(null);
      setDraft(emptyDraft());
      setEditing(false);
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

  const words = draft.content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;

  const list = (
    <ListPane
      title="Posts"
      count={filtered.length}
      search={search}
      onSearch={setSearch}
      onNew={newPost}
      newLabel="New post"
      loading={loading}
      emptyText={posts.length === 0 ? "No posts yet. Write your first one." : "No posts match your search."}
    >
      {filtered.map((p) => (
        <ListRow
          key={p.id}
          active={editing && p.id === selectedId}
          onClick={() => openPost(p.id)}
          title={p.title}
          meta={new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          thumb={p.cover_image_url}
          published={p.published}
        />
      ))}
    </ListPane>
  );

  const editor = !editing ? (
    <EmptyEditor
      title="Select a post"
      text="Choose a post from the list to edit it, or write a new one."
      action={
        <button type="button" onClick={newPost} className={btnPrimary}>
          <Plus size={16} aria-hidden="true" /> New post
        </button>
      }
    />
  ) : (
    <div>
      <EditorHeader
        kicker={draft.id ? "Edit post" : "New post"}
        title={draft.title || "Untitled post"}
        dirty={dirty}
        published={draft.published}
        onPublishedChange={(v) => update("published", v)}
        viewHref={draft.id && draft.slug.trim() ? `/blogs/${draft.slug}` : undefined}
        onDelete={draft.id ? remove : undefined}
        onSave={() => void save()}
        saving={saving}
        saveLabel={draft.id ? "Save changes" : "Create post"}
        onBack={backToList}
      />
      <EditorBody>
        <Card title="Basics">
          <Field label="Title">
            <input value={draft.title} onChange={(e) => onTitleChange(e.target.value)} maxLength={140} className={`${inputCls} h-11 text-base font-medium`} placeholder="Post title" />
          </Field>
          <Field label="Web address" hint={`www.fotolaminate.com/blogs/${draft.slug || "…"} — filled in from the title; you can change it.`}>
            <input value={draft.slug} onChange={(e) => update("slug", slugify(e.target.value))} maxLength={140} className={inputCls} placeholder="my-post-slug" />
          </Field>
        </Card>

        <Card title="Article" description={`${words} words · about ${Math.max(1, Math.round(words / 200))} min read`}>
          <Field label="Content" hint="HTML is supported (headings, lists, links).">
            <textarea value={draft.content} onChange={(e) => update("content", e.target.value)} rows={18} className={textareaCls} placeholder="Write the post here" />
          </Field>
        </Card>

        <Card title="Images">
          <div className="grid gap-6 md:grid-cols-2">
            <ImageField label="Cover image" value={draft.coverImageUrl} onChange={(v) => update("coverImageUrl", v)} onUpload={(f) => void uploadImage(f, "cover")} uploading={uploadingCover} />
            <ImageField
              label="Social sharing image"
              value={draft.ogImageUrl}
              onChange={(v) => update("ogImageUrl", v)}
              onUpload={(f) => void uploadImage(f, "og")}
              uploading={uploadingOg}
              hint="Uses the cover image if empty."
            />
          </div>
        </Card>

        <Card title="Search engine (SEO)" description="How this post appears in Google results.">
          <SeoPreview title={draft.metaTitle || draft.title} description={draft.metaDescription} path={`/blogs/${draft.slug}`} />
          <Field label="SEO title" counter={{ value: draft.metaTitle.trim().length, ideal: [50, 60] }} hint="Uses the post title if empty.">
            <input value={draft.metaTitle} onChange={(e) => update("metaTitle", e.target.value)} maxLength={80} className={inputCls} />
          </Field>
          <Field label="SEO description" counter={{ value: draft.metaDescription.trim().length, ideal: [140, 160] }}>
            <textarea value={draft.metaDescription} onChange={(e) => update("metaDescription", e.target.value)} rows={3} maxLength={200} className={textareaCls} />
          </Field>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Tags" hint="Separate with commas.">
              <input value={draft.tags} onChange={(e) => update("tags", e.target.value)} className={inputCls} placeholder="Cold lamination, Maintenance" />
            </Field>
            <Field label="Keywords" hint="Separate with commas. Uses the tags if empty.">
              <input value={draft.keywords} onChange={(e) => update("keywords", e.target.value)} className={inputCls} />
            </Field>
          </div>
        </Card>

        <Card title="FAQs" description="Shown as questions and answers at the end of the post.">
          <FaqField faqs={draft.faqs} onChange={(faqs) => update("faqs", faqs)} label="Questions" />
        </Card>

        <Card title="Advanced" description="Structured data (JSON-LD) for search engines. Optional.">
          <JsonListEditor
            items={draft.schemas}
            onChange={(schemas) => update("schemas", schemas)}
            addLabel="Add schema"
            emptyText="No structured data added."
            placeholder="Paste JSON or a JSON-LD <script> block"
          />
        </Card>
      </EditorBody>
    </div>
  );

  return <ManagerLayout list={list} editor={editor} showEditorOnMobile={editing} />;
};

export default BlogManager;
