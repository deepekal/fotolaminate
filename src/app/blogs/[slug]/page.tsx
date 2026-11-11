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

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let initialPost: BlogPostRecord | null = null;
  
  try {
    const r = await query<BlogPostRecord>(
      "select * from public.blog_posts where published = true and slug = $1 limit 1",
      [slug]
    );
    if (r.rows[0]) {
      initialPost = r.rows[0];
    }
  } catch (e) {
    // Ignore error
  }

  const schemas = Array.isArray(initialPost?.schemas) ? [...initialPost.schemas] : [];

  if (initialPost?.faqs && Array.isArray(initialPost.faqs) && initialPost.faqs.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": initialPost.faqs.map((faq: { q: string; a: string }) => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.a
        }
      }))
    });
  }

  return (
    <>
      {schemas.map((schema, index) => {
        const schemaString = typeof schema === "string" ? schema : JSON.stringify(schema);
        return (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: schemaString }}
          />
        );
      })}
      <BlogPostPage initialPost={initialPost} />
    </>
  );
}
