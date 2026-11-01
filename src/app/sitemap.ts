import type { MetadataRoute } from "next";
import { query } from "@server/lib/db";
import { slugifyCategory } from "@/lib/slug";

export const runtime = "nodejs";

const STATIC_PATHS: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/",                   changeFrequency: "weekly",  priority: 1.0 },
  { path: "/about",              changeFrequency: "monthly", priority: 0.8 },
  { path: "/products",           changeFrequency: "weekly",  priority: 0.9 },
  { path: "/catalogue",          changeFrequency: "monthly", priority: 0.8 },
  { path: "/videos",             changeFrequency: "monthly", priority: 0.7 },
  { path: "/blogs",              changeFrequency: "weekly",  priority: 0.8 },
  { path: "/awards",             changeFrequency: "monthly", priority: 0.7 },
  { path: "/certificates",       changeFrequency: "monthly", priority: 0.7 },
  { path: "/exhibition-photos",  changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact",            changeFrequency: "monthly", priority: 0.8 },
  { path: "/sitemap",            changeFrequency: "monthly", priority: 0.4 },
  { path: "/privacy-disclaimer", changeFrequency: "yearly",  priority: 0.3 },
  { path: "/FotolaminateCatalogue.pdf", changeFrequency: "yearly", priority: 0.5 },
];

type BlogRow = { slug: string; updated_at: string };
type ProductRow = { slug: string; updated_at: string };
type CategoryRow = { category: string };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.fotolaminate.com";
  const now = new Date();

  const items: MetadataRoute.Sitemap = STATIC_PATHS.map(({ path, changeFrequency, priority }) => ({
    url: new URL(path, base).toString(),
    lastModified: now,
    changeFrequency,
    priority,
  }));

  try {
    const blogs = await query<BlogRow>(
      "select slug, updated_at::text as updated_at from public.blog_posts where published = true order by updated_at desc",
    );
    for (const row of blogs.rows) {
      items.push({
        url: new URL(`/blogs/${encodeURIComponent(row.slug)}`, base).toString(),
        lastModified: row.updated_at ? new Date(row.updated_at) : now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch {
    // If DB isn't configured (local/dev), still serve static sitemap.
  }

  try {
    const products = await query<ProductRow>(
      "select slug, updated_at::text as updated_at from public.products where published = true order by updated_at desc",
    );
    for (const row of products.rows) {
      items.push({
        url: new URL(`/products/${encodeURIComponent(row.slug)}`, base).toString(),
        lastModified: row.updated_at ? new Date(row.updated_at) : now,
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }

    const categories = await query<CategoryRow>(
      "select distinct category from public.products where published = true and category is not null and length(category) > 0",
    );
    for (const row of categories.rows) {
      items.push({
        url: new URL(`/products/category/${slugifyCategory(row.category)}`, base).toString(),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch {
    // ignore
  }

  // Do NOT include /dashboard (admin) in sitemap.
  return items;
}
