import Link from "next/link";
import { query } from "@server/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BlogRow = { title: string; slug: string };
type ProductRow = { name: string; slug: string };

const STATIC_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/products", label: "Products" },
  { href: "/blogs", label: "Blogs" },
  { href: "/awards", label: "Awards" },
  { href: "/certificates", label: "Certificates" },
  { href: "/exhibition-photos", label: "Exhibition Photos" },
  { href: "/contact", label: "Contact" },
] as const;

async function getPublishedProducts(): Promise<ProductRow[]> {
  try {
    const r = await query<ProductRow>(
      "select name, slug from public.products where published = true order by updated_at desc",
    );
    return r.rows;
  } catch {
    return [];
  }
}

async function getPublishedBlogs(): Promise<BlogRow[]> {
  try {
    const r = await query<BlogRow>(
      "select title, slug from public.blog_posts where published = true order by updated_at desc",
    );
    return r.rows;
  } catch {
    return [];
  }
}

export default async function SitemapPage() {
  const [products, blogs] = await Promise.all([getPublishedProducts(), getPublishedBlogs()]);

  return (
    <main className="section-padding bg-card">
      <div className="container-max">
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">Sitemap</h1>
          <p className="mt-2 text-sm text-muted-foreground">Quick links to all important pages.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <section className="rounded-lg border border-border bg-card p-6 shadow-industrial">
            <h2 className="mb-4 font-display text-lg font-bold text-foreground">Pages</h2>
            <ul className="space-y-2 text-sm">
              {STATIC_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-accent hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-border bg-card p-6 shadow-industrial">
            <h2 className="mb-4 font-display text-lg font-bold text-foreground">Products</h2>
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground">No products found.</p>
            ) : (
              <ul className="max-h-[420px] space-y-2 overflow-auto pr-2 text-sm">
                {products.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/products/${p.slug}`} className="text-accent hover:underline">
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card p-6 shadow-industrial">
            <h2 className="mb-4 font-display text-lg font-bold text-foreground">Blogs</h2>
            {blogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No blogs found.</p>
            ) : (
              <ul className="max-h-[420px] space-y-2 overflow-auto pr-2 text-sm">
                {blogs.map((b) => (
                  <li key={b.slug}>
                    <Link href={`/blogs/${b.slug}`} className="text-accent hover:underline">
                      {b.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
