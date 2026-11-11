"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { CalendarDays, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { api, BlogPostRecord } from "@/lib/api";
import { blogPosts } from "@/content/blogs";

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
    content: p.sections.map((s) => s.paragraphs.join("\n")).join("\n\n"),
    published: true,
    created_at: p.date,
    updated_at: p.date,
    excerpt: p.excerpt,
  };
}

const ENTITIES: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", "#039": "'" };

/** Plain text from stored HTML/markdown-ish content. */
function toPlainText(input: string): string {
  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#039|amp|quot|apos|lt|gt|nbsp);/g, (_, e: string) => ENTITIES[e] ?? " ")
    .replace(/\\(["'])/g, "$1")
    .replace(/\s*\bSubtitle:\s*/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
}

/** A readable 1–3 sentence summary: meta description first, else the opening of the article,
 *  skipping an all-caps title line such as "UV COATING MACHINE". */
function summaryOf(post: BlogPostRecord, max = 220): string {
  // Imported meta descriptions were cut at ~150 chars and end in "..."; prefer the article text then.
  const meta = post.meta_description || post.excerpt || "";
  const truncated = /(\.\.\.|…)\s*$/.test(meta) && toPlainText(post.content || "").length > 0;
  const source = (truncated ? post.content : meta) || post.content || "";
  let text = toPlainText(source).replace(/^([A-Z0-9&\-\s]{6,}?)\s+(?=[A-Z][a-z])/, "");
  const wasCut = /(\.\.\.|…)$/.test(text);
  text = text.replace(/\.\.\.$|…$/, "").trim();
  if (text.length <= max) return wasCut ? `${text.slice(0, text.lastIndexOf(" "))}…` : text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

function readingMinutes(content: string): number {
  const words = toPlainText(content).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function formatDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const PostMeta = ({ post, light = false }: { post: BlogPostRecord; light?: boolean }) => {
  const tone = light ? "text-primary-foreground/70" : "text-muted-foreground";
  const hasContent = toPlainText(post.content || "").length > 0;
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${tone}`}>
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays size={14} aria-hidden="true" />
        <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
      </span>
      {hasContent ? (
        <span className="inline-flex items-center gap-1.5">
          <Clock size={14} aria-hidden="true" />
          {readingMinutes(post.content)} min read
        </span>
      ) : null}
    </div>
  );
};

/** Machine photo on an engineering-drawing grid; multiply blend drops the white studio background. */
const BlueprintPhoto = ({ post, className }: { post: BlogPostRecord; className: string }) => (
  <div className={`blueprint relative flex items-center justify-center overflow-hidden ${className}`}>
    {post.cover_image_url ? (
      <img
        src={post.cover_image_url}
        alt=""
        className="h-full w-full object-contain p-3 mix-blend-multiply [filter:brightness(1.06)_contrast(1.08)] transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        loading="lazy"
      />
    ) : null}
  </div>
);

type BlogsPageProps = {
  initialPosts?: BlogPostRecord[];
};

const BlogsPage = ({ initialPosts = [] }: BlogsPageProps) => {
  const [posts, setPosts] = useState<BlogPostRecord[]>(initialPosts);
  const [loading, setLoading] = useState(initialPosts.length === 0);

  useEffect(() => {
    if (initialPosts.length > 0) return;
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const list = await api.blogs.list();
        const published = list.filter((p) => p.published);
        if (active) {
          setPosts(published.length > 0 ? published : blogPosts.map(staticToRecord));
        }
      } catch {
        if (active) setPosts(blogPosts.map(staticToRecord));
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
    // initialPosts only seeds the first render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lead with the newest post that actually has an article body.
  const featured = posts.find((p) => toPlainText(p.content || "").length > 0) ?? posts[0];
  const rest = posts.filter((p) => p !== featured);

  return (
    <>
      <Navbar />

    <header className="gradient-navy pt-28 pb-14">
      <div className="container-max">
        <div className="max-w-3xl">
          <span className="mb-3 inline-block rounded-full border border-accent/40 bg-accent/10 px-4 py-1 font-display text-sm font-semibold tracking-wider text-accent">
            Blogs
          </span>
          <h1 className="mb-4 font-display text-4xl font-bold leading-tight text-primary-foreground md:text-5xl">
            Machine notes from our Delhi factory
          </h1>
          <p className="text-lg text-primary-foreground/75">
            How our lamination, coating, cutting and album-making machines work, what each one is best for, and how
            to get a cleaner finish from them.
          </p>
        </div>
      </div>
    </header>

    <main className="bg-muted">
      <div className="container-max py-12 md:py-16">
        {loading ? (
          <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">Loading articles…</div>
        ) : posts.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
            No articles yet. New machine guides will appear here.
          </div>
        ) : (
          <>
            {featured ? (
              <Link
                href={`/blogs/${featured.slug}`}
                className="group grid overflow-hidden rounded-xl border border-border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:grid-cols-12"
              >
                <BlueprintPhoto post={featured} className="h-64 sm:h-80 lg:col-span-7 lg:h-auto lg:min-h-[26rem]" />
                <div className="flex flex-col justify-center gap-4 p-6 sm:p-8 lg:col-span-5 lg:p-10">
                  <span className="self-start rounded-full bg-accent/10 px-3 py-1 font-display text-sm font-semibold text-accent">
                    Latest guide
                  </span>
                  <h2 className="font-display text-3xl font-bold leading-tight text-foreground transition-colors group-hover:text-accent md:text-4xl">
                    {featured.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground md:text-base">{summaryOf(featured, 260)}</p>
                  <PostMeta post={featured} />
                  <span className="mt-2 self-start rounded-md gradient-accent px-5 py-2.5 font-display text-sm font-bold text-accent-foreground">
                    Read the guide
                  </span>
                </div>
              </Link>
            ) : null}

            {rest.length > 0 ? (
              <section aria-labelledby="more-guides" className="mt-14">
                <h2 id="more-guides" className="mb-6 font-display text-2xl font-bold text-foreground">
                  More machine guides
                </h2>
                <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post, i) => {
                    // A lone card on the last row becomes a wide, horizontal card instead of an orphan.
                    const last = i === rest.length - 1;
                    const wide = last && rest.length % 3 === 1 ? "lg:col-span-3 lg:flex-row lg:gap-6" : "";
                    const wideSm =
                      last && rest.length % 2 === 1
                        ? `sm:col-span-2 sm:flex-row sm:gap-6 ${wide ? "" : "lg:col-span-1 lg:flex-col lg:gap-0"}`
                        : "";
                    const isWide = Boolean(wide || wideSm);
                    return (
                    <Link
                      key={post.slug}
                      href={`/blogs/${post.slug}`}
                      className={`group flex flex-col rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-muted ${wideSm} ${wide}`}
                    >
                      <BlueprintPhoto
                        post={post}
                        className={`h-52 rounded-xl border border-border ${wideSm ? `sm:w-1/2 sm:shrink-0 ${wide ? "" : "lg:w-full"}` : ""} ${wide ? "lg:h-64 lg:w-[calc((100%-3rem)*2/3+1.5rem)] lg:shrink-0" : ""}`}
                      />
                      <div className={`flex flex-1 flex-col gap-2 pt-4 ${wideSm ? `sm:justify-center sm:pt-0 ${wide ? "" : "lg:justify-start lg:pt-4"}` : ""} ${wide ? "lg:justify-center lg:pt-0" : ""}`}>
                        <PostMeta post={post} />
                        <h3 className="font-display text-xl font-bold leading-snug text-foreground transition-colors group-hover:text-accent">
                          {post.title}
                        </h3>
                        <p className={`text-sm leading-relaxed text-muted-foreground ${isWide ? "line-clamp-3" : "line-clamp-2"}`}>{summaryOf(post)}</p>
                      </div>
                    </Link>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </>
        )}

        <div className="mt-16 rounded-xl gradient-navy p-8 text-primary-foreground md:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="mb-3 font-display text-3xl font-bold">Not sure which machine fits your work?</h2>
              <p className="text-sm leading-relaxed text-primary-foreground/70">
                Tell us your media size and daily volume, and we will suggest the right machine and configuration.
              </p>
            </div>
            <div className="flex justify-start lg:justify-end">
              <Link
                href="/contact"
                className="rounded-md gradient-accent px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90"
              >
                Ask for a recommendation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>

    <Footer />
    </>
  );
};

export default BlogsPage;
