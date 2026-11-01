"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Tag } from "lucide-react";
import { api, BlogPostRecord } from "@/lib/api";
import { blogPosts } from "@/content/blogs";

type LatestBlogsProps = {
  limit?: number;
  viewAllHref?: string;
};

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

const LatestBlogs = ({ limit = 3, viewAllHref = "/blogs" }: LatestBlogsProps) => {
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
          setPosts(published.length > 0 ? published.slice(0, limit) : blogPosts.slice(0, limit).map(staticToRecord));
        }
      } catch {
        if (active) setPosts(blogPosts.slice(0, limit).map(staticToRecord));
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [limit]);

  return (
    <section className="section-padding bg-muted">
      <div className="container-max">
        <div className="mb-12 text-center">
          <span className="mb-2 inline-block font-display text-sm font-bold uppercase tracking-widest text-accent">
            Our Latest Blog
          </span>
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">Tips, guides, and updates</h2>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-lg border border-border bg-white p-6 shadow-industrial">
                <div className="mb-4 h-4 w-1/2 rounded bg-muted" />
                <div className="mb-3 h-7 w-5/6 rounded bg-muted" />
                <div className="mb-2 h-4 w-full rounded bg-muted" />
                <div className="h-4 w-4/5 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-lg border border-border bg-white p-6 text-sm text-muted-foreground shadow-industrial">
            No blog posts published yet.
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blogs/${post.slug}`}
                   className="group rounded-lg border border-border bg-white p-6 shadow-industrial hover-lift"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays size={14} />
                      {new Date(post.created_at).toISOString().slice(0, 10)}
                    </span>
                    {post.tags?.[0] ? (
                      <span className="inline-flex items-center gap-2">
                        <Tag size={14} />
                        {post.tags[0]}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mb-2 font-display text-xl font-bold text-foreground transition-colors group-hover:text-accent">
                    {post.title}
                  </h3>
                  <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                    {(post.meta_description ?? post.excerpt ?? "").slice(0, 160)}
                  </p>

                  <div className="font-display text-sm font-semibold text-accent">Read More →</div>
                </Link>
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Link
                href={viewAllHref}
                className="rounded-md gradient-navy px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
              >
                View all blogs
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default LatestBlogs;
