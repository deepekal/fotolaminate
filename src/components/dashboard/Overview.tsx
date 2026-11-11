"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, FileText, ImagePlus, Loader2, Package, Plus } from "lucide-react";
import { api, type BlogPostRecord, type ProductRecord } from "@/lib/api";
import { PageTitle, btnPrimary, btnSecondary, formatDate } from "@/components/dashboard/admin-ui";

const Stat = ({ label, value, onClick }: { label: string; value: number | string; onClick?: () => void }) => (
  <button type="button" onClick={onClick} className="rounded-md border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300">
    <p className="text-xs font-medium text-slate-500">{label}</p>
    <p className="mt-1 font-display text-3xl font-bold text-slate-900">{value}</p>
  </button>
);

const Overview = ({ navigate }: { navigate: (hash: string) => void }) => {
  const [products, setProducts] = useState<ProductRecord[] | null>(null);
  const [posts, setPosts] = useState<BlogPostRecord[] | null>(null);

  useEffect(() => {
    api.products.list().then(setProducts).catch(() => setProducts([]));
    api.blogs.list().then(setPosts).catch(() => setPosts([]));
  }, []);

  if (!products || !posts) {
    return (
      <p className="p-10 text-center text-sm text-slate-500">
        <Loader2 size={18} className="mr-2 inline animate-spin" aria-hidden="true" /> Loading…
      </p>
    );
  }

  const categories = new Set(products.map((p) => p.category).filter(Boolean)).size;
  const noPhoto = products.filter((p) => !p.cover_image_url);
  const drafts = [...products.filter((p) => !p.published).map((p) => ({ kind: "Product", title: p.name, href: `/products/${p.id}` })), ...posts.filter((p) => !p.published).map((p) => ({ kind: "Post", title: p.title, href: `/blogs/${p.id}` }))];
  const emptyPosts = posts.filter((p) => !(p.excerpt ?? "").trim());
  const recent = [...products.map((p) => ({ kind: "Product", title: p.name, at: p.updated_at, href: `/products/${p.id}` })), ...posts.map((p) => ({ kind: "Post", title: p.title, at: p.updated_at, href: `/blogs/${p.id}` }))]
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .slice(0, 6);

  const attention = [
    ...noPhoto.map((p) => ({ text: `${p.name} has no main image`, href: `/products/${p.id}` })),
    ...emptyPosts.map((p) => ({ text: `Blog post "${p.title}" has no article text`, href: `/blogs/${p.id}` })),
  ];

  return (
    <>
      <PageTitle
        title="Dashboard"
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate("/products/new")} className={btnPrimary}>
              <Plus size={16} aria-hidden="true" /> Add product
            </button>
            <button type="button" onClick={() => navigate("/blogs/new")} className={btnSecondary}>
              <FileText size={15} aria-hidden="true" /> Write post
            </button>
            <button type="button" onClick={() => navigate("/media")} className={btnSecondary}>
              <ImagePlus size={15} aria-hidden="true" /> Upload images
            </button>
          </div>
        }
      />
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Products" value={products.length} onClick={() => navigate("/products")} />
          <Stat label="Categories" value={categories} onClick={() => navigate("/products")} />
          <Stat label="Blog posts" value={posts.length} onClick={() => navigate("/blogs")} />
          <Stat label="Drafts" value={drafts.length} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-md border border-slate-200 bg-white shadow-sm">
            <h3 className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">
              <AlertTriangle size={16} className="text-amber-500" aria-hidden="true" /> Needs attention
              <span className="text-slate-400">({attention.length})</span>
            </h3>
            {attention.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500">Nothing to fix — everything has photos and content.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {attention.map((a) => (
                  <li key={a.text}>
                    <button type="button" onClick={() => navigate(a.href)} className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 hover:text-accent">
                      {a.text}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-md border border-slate-200 bg-white shadow-sm">
            <h3 className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">
              <Package size={16} className="text-slate-400" aria-hidden="true" /> Recently updated
            </h3>
            <ul className="divide-y divide-slate-100 text-sm">
              {recent.map((r) => (
                <li key={r.href}>
                  <button type="button" onClick={() => navigate(r.href)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50">
                    <span className="w-16 shrink-0 text-xs text-slate-400">{r.kind}</span>
                    <span className="min-w-0 flex-1 truncate text-slate-800">{r.title}</span>
                    <span className="shrink-0 text-xs text-slate-500">{formatDate(r.at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
};

export default Overview;
