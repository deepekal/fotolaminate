"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { CalendarDays, Tag } from "lucide-react";
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

const BlogsPage = () => {
  const [posts, setPosts] = useState<BlogPostRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  return (
    <>
      <Navbar />

    <header className="gradient-navy pt-28 pb-16">
      <div className="container-max px-4 md:px-8 lg:px-16">
        <div className="max-w-3xl">
          <span className="mb-3 inline-block rounded-full border border-accent/40 bg-accent/10 px-4 py-1 font-display text-sm font-semibold tracking-wider text-accent">
            Blogs
          </span>
          <h1 className="mb-4 font-display text-4xl font-bold leading-tight text-primary-foreground md:text-5xl">
            Guides, maintenance tips, and lamination process insights
          </h1>
          <p className="text-lg text-primary-foreground/75">
            Practical articles to help you improve output quality, reduce rework, and select the right machine category.
          </p>
        </div>
      </div>
    </header>

    <main>
      <section className="section-padding bg-muted">
        <div className="container-max">
          <div className="grid gap-6 md:grid-cols-2">
            {loading ? (
              <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground shadow-industrial">
                Loading…
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground shadow-industrial">
                No blog posts published yet.
              </div>
            ) : (
              posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blogs/${post.slug}`}
                  className="group rounded-lg border border-border bg-card p-6 shadow-industrial hover-lift"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays size={14} />
                      {new Date(post.created_at).toISOString().slice(0, 10)}
                    </span>
                    <span className="rounded bg-muted px-2 py-1 font-medium text-foreground/80">Updated</span>
                  </div>

                  <h2 className="mb-2 font-display text-2xl font-bold text-foreground transition-colors group-hover:text-accent">
                    {post.title}
                  </h2>
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                    {(post.meta_description ?? post.excerpt ?? "").slice(0, 160)}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <Tag size={14} />
                      Tags
                    </span>
                    {(post.tags ?? []).slice(0, 6).map((tag) => (
                      <span key={tag} className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-foreground/80">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 font-display text-sm font-semibold text-accent">Read article →</div>
                </Link>
              ))
            )}
          </div>

          <div className="mt-12 rounded-lg gradient-navy p-8 text-primary-foreground shadow-industrial md:p-10">
            <div className="grid items-center gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h3 className="mb-3 font-display text-3xl font-bold">Need a recommendation?</h3>
                <p className="text-sm leading-relaxed text-primary-foreground/70">
                  If you share your media size and daily volume, we can suggest the right product category and machine
                  configuration.
                </p>
              </div>
              <div className="flex justify-start lg:justify-end">
                <Link
                  href="/contact"
                  className="rounded-md gradient-accent px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90"
                >
                  Contact us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <Footer />
    </>
  );
};

export default BlogsPage;
