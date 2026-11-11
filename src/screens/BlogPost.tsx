"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CalendarDays, ChevronLeft, Tag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api, BlogPostRecord } from "@/lib/api";
import { blogPosts } from "@/content/blogs";
import FAQ from "@/components/FAQ";
import FAQSection from "@/components/FAQSection";

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
      .map((s) => `## ${s.heading}\n\n${s.paragraphs.join("\n\n")}${s.bullets ? "\n\n" + s.bullets.map((b) => `- ${b}`).join("\n") : ""}`)
      .join("\n\n"),
    published: true,
    created_at: p.date,
    updated_at: p.date,
    excerpt: p.excerpt,
    faqs: [],
  };
}

const BlogPostPage = ({ initialPost = null }: { initialPost?: BlogPostRecord | null }) => {
  const params = useParams<{ slug?: string | string[] }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const [post, setPost] = useState<BlogPostRecord | null>(initialPost);
  const [loading, setLoading] = useState(!initialPost);

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

    load();
    return () => {
      active = false;
    };
  }, [slug, initialPost]);

  const jsonLdSchemas = useMemo(() => {
    const list = Array.isArray(post?.schemas) ? post?.schemas : [];
    return list
      .map((s) => {
        try {
          return JSON.stringify(s);
        } catch {
          return null;
        }
      })
      .filter(Boolean) as string[];
  }, [post]);

  if (!loading && !post) {
    return (
      <>
        <Navbar />
        <div className="section-padding bg-muted pt-28">
          <div className="container-max">
            <div className="rounded-lg border border-border bg-card p-8 shadow-industrial">
              <h1 className="mb-2 font-display text-3xl font-bold text-foreground">Article not found</h1>
              <p className="mb-6 text-sm text-muted-foreground">
                The article you are looking for does not exist or has been moved.
              </p>
              <Link href="/blogs" className="inline-flex items-center gap-2 font-display text-sm font-bold text-accent">
                <ChevronLeft size={16} />
                Back to blogs
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      {jsonLdSchemas.map((json, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
      ))}

      <header className="gradient-navy pt-28 pb-10">
        <div className="container-max">
          <div className="max-w-4xl">
            <Link href="/blogs" className="mb-6 inline-flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-accent">
              <ChevronLeft size={16} />
              Back to blogs
            </Link>

            <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-primary-foreground/70">
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={14} />
                {loading
                  ? "Loading…"
                  : post?.created_at
                    ? new Date(post.created_at).toISOString().slice(0, 10)
                    : ""}
              </span>
              <span className="rounded bg-primary-foreground/10 px-2 py-1 font-medium text-primary-foreground/90">
                {loading ? "" : "Article"}
              </span>
            </div>

            <h1 className="mb-4 font-display text-4xl font-bold leading-tight text-primary-foreground md:text-5xl">
                {loading ? "Loading…" : post?.title ?? ""}
            </h1>
              <p className="text-lg text-primary-foreground/75">{loading ? "" : (post?.meta_description ?? "")}</p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 text-xs text-primary-foreground/70">
                <Tag size={14} />
                Tags
              </span>
              {!loading &&
                  (post?.tags ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-3 py-1 text-xs text-primary-foreground/85"
                  >
                    {tag}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="section-padding bg-card">
          <div className="container-max">
            <article className="mx-auto max-w-4xl rounded-lg border border-border bg-card p-6 shadow-industrial md:p-10">
              {loading ? (
                <div className="rounded-lg border border-border bg-muted p-6 text-sm text-muted-foreground">
                  Loading…
                </div>
              ) : (
                <div className="space-y-4">
                  <div 
                    className="prose prose-sm md:prose-base max-w-none text-muted-foreground prose-headings:font-display prose-headings:text-foreground prose-a:text-accent prose-strong:text-foreground"
                    dangerouslySetInnerHTML={{ __html: post?.content ?? "" }}
                  />
                </div>
              )}

              {/* Page-specific FAQ section — only renders when the post has FAQs */}
              {post?.faqs && post.faqs.length > 0 && (
                <div className="mt-10">
                  <FAQSection faqs={post.faqs} />
                </div>
              )}

              <div className="mt-10 rounded-lg gradient-navy p-6 text-primary-foreground">
                <h3 className="mb-2 font-display text-xl font-bold">Want a model recommendation?</h3>
                <p className="mb-5 text-sm text-primary-foreground/70">
                  Share your media width, film type, and expected daily volume. We will suggest the right product
                  category and configuration.
                </p>
                <Link
                  href="/contact"
                  className="inline-block rounded-md gradient-accent px-5 py-3 font-display text-sm font-bold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90"
                >
                  Contact us
                </Link>
              </div>
            </article>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default BlogPostPage;
