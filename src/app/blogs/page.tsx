import BlogsPage from "@/screens/Blogs";
import type { BlogPostRecord } from "@/lib/api";

import type { Metadata } from "next";

import { query } from "@server/lib/db";

export const metadata: Metadata = {
  title: "Blogs",
  description: "Tips, guides, and updates from Foto Laminate Precision.",
  keywords: ["blogs", "tips", "guides", "updates"],
  alternates: { canonical: "/blogs" },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  // Render posts on the server so the article list is in the HTML (visible to search engines).
  let initialPosts: BlogPostRecord[] = [];
  try {
    const res = await query<BlogPostRecord>(
      `select * from public.blog_posts where published = true order by created_at desc`,
    );
    const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v));
    initialPosts = res.rows.map((r) => ({ ...r, created_at: iso(r.created_at), updated_at: iso(r.updated_at) }));
  } catch {
    // The client component falls back to the API / static posts.
  }
  return <BlogsPage initialPosts={initialPosts} />;
}
