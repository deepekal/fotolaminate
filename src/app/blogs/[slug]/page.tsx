import BlogPostPage from "@/screens/BlogPost";

import type { Metadata } from "next";
import { query } from "@server/lib/db";

type BlogMetaRow = {
  title: string;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[];
  keywords: string[];
  cover_image_url: string | null;
  og_image_url: string | null;
};

export const runtime = "nodejs";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  try {
    const r = await query<BlogMetaRow>(
      "select title, meta_title, meta_description, tags, keywords, cover_image_url, og_image_url from public.blog_posts where published = true and slug = $1 limit 1",
      [slug],
    );

    const post = r.rows[0];
    if (!post) {
      return {
        title: "Blog",
        robots: { index: false, follow: false },
      };
    }

    const title = post.meta_title?.trim() || post.title;
    const description =
      (post.meta_description?.trim() || `Read ${post.title} from Foto Laminate Precision.`).slice(0, 160);
    const image = post.og_image_url || post.cover_image_url || "/logo.png";

    return {
      title,
      description,
      keywords: [
        "Foto Laminate Precision",
        ...((post.keywords ?? []).filter(Boolean) as string[]),
        ...((post.tags ?? []).filter(Boolean) as string[]),
      ],
      alternates: { canonical: `/blogs/${slug}` },
      openGraph: {
        type: "article",
        title,
        description,
        url: `/blogs/${slug}`,
        images: [{ url: image, alt: title }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return {
      title: "Blog",
      alternates: { canonical: `/blogs/${slug}` },
    };
  }
}

import type { BlogPostRecord } from "@/lib/api";

const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v ?? ""));

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let initialPost: BlogPostRecord | null = null;
  let related: BlogPostRecord[] = [];

  try {
    const r = await query<BlogPostRecord>("select * from public.blog_posts where published = true and slug = $1 limit 1", [slug]);
    if (r.rows[0]) initialPost = { ...r.rows[0], created_at: iso(r.rows[0].created_at), updated_at: iso(r.rows[0].updated_at) };

    // Other guides for the "More machine guides" strip (newest first, skip empty posts).
    const rel = await query<BlogPostRecord>(
      `select id, title, slug, cover_image_url, meta_description, created_at, updated_at, left(content, 600) as content
       from public.blog_posts
       where published = true and slug <> $1 and length(content) > 0
       order by created_at desc limit 3`,
      [slug],
    );
    related = rel.rows.map((p) => ({ ...p, created_at: iso(p.created_at), updated_at: iso(p.updated_at) }));
  } catch {
    // The client component falls back to the API / static content.
  }

  // FAQPage structured data is added by <FAQSection>; only custom schemas are rendered here.
  const schemas = Array.isArray(initialPost?.schemas) ? initialPost.schemas : [];

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: typeof schema === "string" ? schema : JSON.stringify(schema) }}
        />
      ))}
      <BlogPostPage initialPost={initialPost} related={related} />
    </>
  );
}
