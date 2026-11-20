"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownUp, Check, Copy } from "lucide-react";
import type { ProductRecord } from "@/lib/api";
import { compareProductCode, compareSize } from "@/lib/product-table";

type Props = {
  category: string;
  products: ProductRecord[];
  /** Fallback image when a product has no photo. */
  fallbackImage?: string;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** "At a glance" table under a category's product cards: ID, size, name, short description, photo, updated. */
const CategoryProductTable = ({ category, products, fallbackImage }: Props) => {
  const [sort, setSort] = useState<"default" | "size">("default");
  const [copied, setCopied] = useState(false);

  const rows = useMemo(() => {
    const list = [...products];
    if (sort === "size") list.sort((a, b) => compareSize(a.size ?? "", b.size ?? ""));
    else list.sort(compareProductCode);
    return list;
  }, [products, sort]);

  if (products.length === 0) return null;

  const copyTable = async () => {
    const text = [
      ["Product ID", "Size", "Product", "Description", "Updated"].join("\t"),
      ...rows.map((p) => [p.product_code ?? "", p.size ?? "", p.name, (p.summary ?? "").replace(/\s+/g, " "), formatDate(p.updated_at)].join("\t")),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <section className="mt-10" aria-labelledby={`table-${category}`}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-t border-border pt-8">
        <div>
          <h3 id={`table-${category}`} className="font-display text-2xl font-bold text-foreground">
            {category} range at a glance
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Every machine in this category in one table. Click a product name for full specifications and enquiry options.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSort((s) => (s === "size" ? "default" : "size"))}
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-display text-sm font-semibold transition-colors ${sort === "size" ? "border-accent bg-accent/10 text-accent" : "border-border bg-white text-foreground hover:border-accent/50"}`}
            aria-pressed={sort === "size"}
          >
            <ArrowDownUp size={14} aria-hidden="true" /> Sort by size
          </button>
          <button
            type="button"
            onClick={() => void copyTable()}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 font-display text-sm font-semibold text-foreground transition-colors hover:border-accent/50"
          >
            {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />} {copied ? "Copied" : "Copy table"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-industrial">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="bg-primary text-left font-display text-base text-primary-foreground">
              <th scope="col" className="whitespace-nowrap px-4 py-3">Product ID</th>
              <th scope="col" className="whitespace-nowrap px-4 py-3">Size</th>
              <th scope="col" className="whitespace-nowrap px-4 py-3">Product name</th>
              <th scope="col" className="px-4 py-3">Short description</th>
              <th scope="col" className="px-4 py-3 text-center">Image</th>
              <th scope="col" className="whitespace-nowrap px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={p.id} className={i % 2 ? "bg-muted/40" : "bg-white"}>
                <td className="whitespace-nowrap border-t border-border px-4 py-3 font-display text-lg font-bold tabular-nums text-foreground">
                  {p.product_code || <span className="text-muted-foreground">—</span>}
                </td>
                <td className="whitespace-nowrap border-t border-border px-4 py-3">
                  {p.size ? (
                    <span className="inline-block rounded-md bg-primary/10 px-2.5 py-1 font-semibold text-primary">{p.size}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap border-t border-border px-4 py-3 font-display text-lg font-bold">
                  <Link href={`/products/${p.slug}`} className="text-foreground transition-colors hover:text-accent">
                    {p.name}
                  </Link>
                </td>
                <td className="min-w-[320px] max-w-[520px] border-t border-border px-4 py-3 leading-relaxed text-muted-foreground">
                  <span className="line-clamp-3">{p.summary ?? ""}</span>
                </td>
                <td className="w-28 border-t border-border px-4 py-2 text-center">
                  <Link href={`/products/${p.slug}`} className="inline-block">
                    <img
                      src={p.cover_image_url || fallbackImage || ""}
                      alt={p.name}
                      className="mx-auto h-16 w-auto max-w-[96px] rounded bg-white object-contain"
                      loading="lazy"
                      onError={(e) => {
                        if (fallbackImage) e.currentTarget.src = fallbackImage;
                      }}
                    />
                  </Link>
                </td>
                <td className="whitespace-nowrap border-t border-border px-4 py-3 tabular-nums text-muted-foreground">{formatDate(p.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Updated shows when the product details were last revised by Foto Laminate.</p>
    </section>
  );
};

export default CategoryProductTable;
