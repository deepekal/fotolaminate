"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CalendarDays, Check, ChevronLeft, Clock, Link2, MessageCircle, Phone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api, BlogPostRecord } from "@/lib/api";
import { blogPosts } from "@/content/blogs";
import FAQSection from "@/components/FAQSection";
import { stripHtml, toEditorHtml } from "@/lib/rich-text";

const WHATSAPP_PHONE = "919873684816";
const CALL_PHONE = "+919873684816";
const SITE = "https://www.fotolaminate.com";

function staticToRecord(p: (typeof blogPosts)[0]): BlogPostRecord {
  return {
    id: p.slug,
    title: p.title,
    slug: p.slug,
    meta_title: null,
    meta_description: p.excerpt,
    tags: p.tags,
    keywords: [],
    schemas: [],
    cover_image_url: null,
    og_image_url: null,
    content: p.sections
      .map((s) => `<h2>${s.heading}</h2>${s.paragraphs.map((x) => `<p>${x}</p>`).join("")}${s.bullets ? `<ul>${s.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>` : ""}`)
      .join(""),
    published: true,
    created_at: p.date,
    updated_at: p.date,
    excerpt: p.excerpt,
    faqs: [],
  };
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function readingMinutes(html: string) {
  return Math.max(1, Math.round(stripHtml(html).split(" ").filter(Boolean).length / 200));
}

function summaryOf(post: BlogPostRecord, max = 140) {
  const meta = (post.meta_description ?? "").replace(/(\.\.\.|…)\s*$/, "");
  const text = stripHtml(meta && !/(\.\.\.|…)\s*$/.test(post.meta_description ?? "") ? meta : post.content || meta).replace(/^([A-Z0-9&\-\s]{6,}?)\s+(?=[A-Z][a-z])/, "");
  return text.length <= max ? text : `${text.slice(0, text.slice(0, max).lastIndexOf(" "))}…`;
}

/** Normalise stored content (plain-text paragraphs → <p>) and give headings ids for the contents list. */
function prepareArticle(raw: string) {
  const toc: { id: string; text: string; level: number }[] = [];
  const used = new Set<string>();
  const html = toEditorHtml(raw).replace(/<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi, (_m, tag: string, attrs: string, inner: string) => {
    const text = stripHtml(inner);
    let id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "section";
    while (used.has(id)) id += "-2";
    used.add(id);
    toc.push({ id, text, level: tag.toLowerCase() === "h2" ? 2 : 3 });
    return `<${tag}${attrs.replace(/\sid="[^"]*"/i, "")} id="${id}">${inner}</${tag}>`;
  });
  return { html, toc };
}

/** Machine photo on the engineering-grid background used across the blog. */
const BlueprintPhoto = ({ src, className, eager = false }: { src?: string | null; className: string; eager?: boolean }) => (
  <div className={`blueprint flex items-center justify-center overflow-hidden ${className}`}>
    {src ? (
      <img
        src={src}
        alt=""
        className="h-full w-full object-contain p-4 mix-blend-multiply [filter:brightness(1.06)_contrast(1.08)]"
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
      />
    ) : null}
  </div>
);

function useReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = document.getElementById("article-body");
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      setProgress(total <= 0 ? 1 : Math.min(1, Math.max(0, -rect.top / total)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return progress;
}

type Props = { initialPost?: BlogPostRecord | null; related?: BlogPostRecord[] };

const BlogPostPage = ({ initialPost = null, related = [] }: Props) => {
  const params = useParams<{ slug?: string | string[] }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const [post, setPost] = useState<BlogPostRecord | null>(initialPost);
  const [loading, setLoading] = useState(!initialPost);
  const [copied, setCopied] = useState(false);
  const progress = useReadingProgress();

  useEffect(() => {
    let active = true;

    async function load() {
      if (!slug || initialPost) return;
      setLoading(true);
      try {
        const p = await api.blogs.getBySlug(slug);
        if (active) setPost(p);
      } catch {
        // Fall back to static blog content
        const staticPost = blogPosts.find((b) => b.slug === slug);
        if (active) setPost(staticPost ? staticToRecord(staticPost) : null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [slug, initialPost]);

  const article = useMemo(() => prepareArticle(post?.content ?? ""), [post?.content]);
  const hasBody = stripHtml(article.html).length > 0;
  const url = `${SITE}/blogs/${post?.slug ?? slug ?? ""}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  if (!loading && !post) {
    return (
      <>
        <Navbar />
        <main className="bg-muted pt-32 pb-20">
          <div className="container-max">
            <div className="mx-auto max-w-xl rounded-xl border border-border bg-card p-8 text-center">
              <h1 className="mb-2 font-display text-3xl font-bold text-foreground">Article not found</h1>
              <p className="mb-6 text-sm text-muted-foreground">This article doesn’t exist or has been moved.</p>
              <Link href="/blogs" className="inline-flex items-center gap-2 font-display text-sm font-bold text-accent">
                <ChevronLeft size={16} aria-hidden="true" /> Back to all guides
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const waEnquiry = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(`Hi, I read "${post?.title ?? ""}" on your website and would like details.`)}`;
  const waShare = `https://wa.me/?text=${encodeURIComponent(`${post?.title ?? ""} — ${url}`)}`;

  return (
    <>
      {/* Reading progress */}
      <div className="fixed inset-x-0 top-0 z-[60] h-[3px] bg-transparent" aria-hidden="true">
        <div className="h-full origin-left bg-accent" style={{ transform: `scaleX(${progress})` }} />
      </div>

      <Navbar />

      <header className="gradient-navy pb-28 pt-28 md:pb-32">
        <div className="container-max">
          <div className="max-w-3xl">
            <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-primary-foreground/60">
              <Link href="/blogs" className="inline-flex items-center gap-1 hover:text-accent">
                <ChevronLeft size={16} aria-hidden="true" /> Machine guides
              </Link>
            </nav>
            <h1 className="font-display text-4xl font-bold leading-[1.1] text-primary-foreground md:text-5xl lg:text-[3.4rem]">
              {loading ? "Loading…" : post?.title}
            </h1>
            {!loading && post ? (
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-primary-foreground/70">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={15} aria-hidden="true" />
                  <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
                </span>
                {hasBody ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={15} aria-hidden="true" /> {readingMinutes(article.html)} min read
                  </span>
                ) : null}
                {(post.tags ?? [])
                  .filter((t) => t && t.toLowerCase() !== "news")
                  .slice(0, 4)
                  .map((tag) => (
                    <span key={tag} className="rounded-full bg-primary-foreground/10 px-3 py-0.5 text-xs text-primary-foreground/85">
                      {tag}
                    </span>
                  ))}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* flow-root stops the cover\u2019s negative margin collapsing through <main> (it should overlap the header, not shift main up) */}
      <main className="flow-root bg-muted pb-16">
        <div className="container-max">
          {/* Cover overlaps the header edge */}
          <BlueprintPhoto src={post?.cover_image_url} eager className="-mt-20 h-64 rounded-xl border border-border shadow-industrial sm:h-80 md:-mt-24 md:h-[26rem]" />

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-14">
            <article id="article-body" className="min-w-0 rounded-xl border border-border bg-card p-6 sm:p-10">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : hasBody ? (
                <div
                  className="prose prose-slate max-w-none text-[17px] leading-8 prose-headings:scroll-mt-28 prose-headings:font-display prose-headings:text-foreground prose-h2:mt-10 prose-h2:text-3xl prose-h3:text-2xl prose-p:text-slate-700 prose-a:font-medium prose-a:text-accent prose-strong:text-slate-900 prose-li:text-slate-700 prose-li:marker:text-accent prose-ol:pl-5 prose-ul:pl-5"
                  dangerouslySetInnerHTML={{ __html: article.html }}
                />
              ) : (
                <div className="py-6 text-center">
                  <p className="font-display text-xl font-bold text-foreground">The full guide is coming soon</p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    Meanwhile, we’re happy to share details, photos and prices for this machine on WhatsApp or by phone.
                  </p>
                </div>
              )}

              {post?.faqs && post.faqs.length > 0 ? (
                <div className="mt-12 border-t border-border pt-4">
                  <FAQSection faqs={post.faqs} heading="Questions about this machine" />
                </div>
              ) : null}
            </article>

            <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
              {article.toc.length >= 2 ? (
                <nav aria-label="On this page" className="rounded-xl border border-border bg-card p-5">
                  <p className="mb-3 font-display text-lg font-bold text-foreground">On this page</p>
                  <ul className="space-y-1.5 text-sm">
                    {article.toc.map((h) => (
                      <li key={h.id} className={h.level === 3 ? "pl-3" : ""}>
                        <a href={`#${h.id}`} className="block text-muted-foreground transition-colors hover:text-accent">
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              ) : null}

              <div className="rounded-xl gradient-navy p-5 text-primary-foreground">
                <p className="font-display text-xl font-bold">Need help choosing?</p>
                <p className="mt-1.5 text-sm leading-relaxed text-primary-foreground/75">
                  Tell us your media size and daily volume — we’ll suggest the right machine and price.
                </p>
                <div className="mt-4 grid gap-2">
                  <a href={waEnquiry} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#25D366] text-sm font-semibold text-white hover:bg-[#1EBE57]">
                    <MessageCircle size={16} aria-hidden="true" /> Ask on WhatsApp
                  </a>
                  <a href={`tel:${CALL_PHONE}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-md gradient-accent text-sm font-semibold text-accent-foreground hover:opacity-90">
                    <Phone size={16} aria-hidden="true" /> +91 98736 84816
                  </a>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <p className="mb-3 text-sm font-semibold text-foreground">Share this guide</p>
                <div className="flex gap-2">
                  <a href={waShare} target="_blank" rel="noreferrer" className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-border text-sm font-medium text-foreground hover:border-accent hover:text-accent">
                    <MessageCircle size={15} aria-hidden="true" /> WhatsApp
                  </a>
                  <button type="button" onClick={() => void copyLink()} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-border text-sm font-medium text-foreground hover:border-accent hover:text-accent">
                    {copied ? <Check size={15} aria-hidden="true" /> : <Link2 size={15} aria-hidden="true" />} {copied ? "Copied" : "Copy link"}
                  </button>
                </div>
              </div>
            </aside>
          </div>

          {related.length > 0 ? (
            <section aria-labelledby="more-guides" className="mt-16">
              <div className="mb-6 flex items-baseline justify-between gap-4">
                <h2 id="more-guides" className="font-display text-3xl font-bold text-foreground">
                  More machine guides
                </h2>
                <Link href="/blogs" className="font-display text-sm font-semibold text-accent hover:underline">
                  All guides
                </Link>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => (
                  <Link key={r.slug} href={`/blogs/${r.slug}`} className="group flex flex-col rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                    <BlueprintPhoto src={r.cover_image_url} className="h-48 rounded-xl border border-border transition-shadow group-hover:shadow-industrial" />
                    <div className="pt-4">
                      <p className="text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
                      <h3 className="mt-1 font-display text-xl font-bold leading-snug text-foreground transition-colors group-hover:text-accent">{r.title}</h3>
                      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{summaryOf(r)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default BlogPostPage;
