"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api, type ProductRecord } from "@/lib/api";
import { slugifyCategory } from "@/lib/slug";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import coldImg from "@/assets/product-cold.jpg";
import hotImg from "@/assets/product-hot.jpg";
import rollImg from "@/assets/product-roll.jpg";
import photoImg from "@/assets/product-photo.jpg";
import industrialImg from "@/assets/product-industrial.jpg";

function getCategoryFallback(category: string | null | undefined): string {
  const t = (category ?? "").toLowerCase();
  if (t.includes("cold") || t.includes("pvc")) return coldImg.src;
  if (t.includes("hot") || t.includes("thermal")) return hotImg.src;
  if (t.includes("roll")) return rollImg.src;
  if (t.includes("album") || t.includes("canvera") || t.includes("karizma") || t.includes("photo")) return photoImg.src;
  if (t.includes("uv") || t.includes("coat") || t.includes("cut") || t.includes("frame") || t.includes("groov") || t.includes("glue")) return industrialImg.src;
  return photoImg.src;
}

function categoryKey(category: string | null | undefined) {
  return slugifyCategory((category ?? "").trim() || "Other");
}

type ProductCategoryPageProps = {
  categorySlugProp?: string;
  initialProducts?: ProductRecord[];
  initialCategoryName?: string;
};

const ProductCategoryPage = ({
  categorySlugProp,
  initialProducts = [],
  initialCategoryName = "",
}: ProductCategoryPageProps) => {
  const params = useParams<{ categorySlug?: string | string[] }>();
  const categorySlug = categorySlugProp || (Array.isArray(params?.categorySlug) ? params.categorySlug[0] : params?.categorySlug);
  const [products, setProducts] = useState<ProductRecord[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);

  useEffect(() => {
    if (initialProducts.length > 0) return;
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const list = await api.products.list();
        const published = list.filter((p) => p.published);
        const filtered = categorySlug
          ? published.filter((p) => categoryKey(p.category) === categorySlug)
          : [];

        const getNum = (name: string) => { const m = name.match(/\d+/); return m ? parseInt(m[0], 10) : 0; };
        
        let sorted = [...filtered];
        if (categorySlug && categorySlug.includes("cold-lamination")) {
          const coldSequence = ["fully auto", "semi auto", "professional", "manual", "economy"];
          sorted.sort((a, b) => {
            // Primary: sort by model number descending (CL620 before CL520)
            const numDiff = getNum(b.name) - getNum(a.name);
            if (numDiff !== 0) return numDiff;
            // Secondary: sort by tier sequence within the same model series
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();
            let aIndex = coldSequence.findIndex(seq => aName.includes(seq));
            let bIndex = coldSequence.findIndex(seq => bName.includes(seq));
            if (aIndex === -1) aIndex = 999;
            if (bIndex === -1) bIndex = 999;
            return aIndex - bIndex;
          });
        } else {
          sorted.sort((a, b) => getNum(b.name) - getNum(a.name));
        }

        if (active) setProducts(sorted);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load products");
        if (active) setProducts([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [categorySlug]);

  const categoryName = useMemo(() => {
    if (initialCategoryName) return initialCategoryName;
    const first = products[0]?.category?.trim();
    if (first) return first;
    if (!categorySlug) return "Category";
    return categorySlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }, [products, categorySlug, initialCategoryName]);

  return (
    <>
      <Navbar />

      <header className="gradient-navy pt-28 pb-16">
        <div className="container-max">
          <div className="max-w-3xl">
            <span className="mb-3 inline-block rounded-full border border-accent/40 bg-accent/10 px-4 py-1 font-display text-sm font-semibold tracking-wider text-accent">
              Product Category
            </span>
            <h1 className="mb-4 font-display text-4xl font-bold leading-tight text-primary-foreground md:text-5xl">
              {categoryName}
            </h1>
            <p className="text-lg text-primary-foreground/75">
              Browse all models in this category.
            </p>
            <div className="mt-5">
              <Link
                href="/products"
                className="inline-block font-display text-sm font-semibold text-accent transition-colors hover:text-accent/80"
              >
                ← Back to all products
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="section-padding bg-white">
          <div className="container-max">
            {loading ? (
              <div className="rounded-lg border border-border bg-muted p-6 text-sm text-muted-foreground shadow-industrial">
                Loading…
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-lg border border-border bg-muted p-6 text-sm text-muted-foreground shadow-industrial">
                No products found for this category.
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((p) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    className="group overflow-hidden rounded-lg bg-white shadow-industrial hover-lift border border-border"
                  >
                    <div className="relative h-52 overflow-hidden bg-white">
                      <img
                        src={p.cover_image_url || getCategoryFallback(p.category)}
                        alt={p.name}
                        className="h-full w-full object-contain"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = getCategoryFallback(p.category);
                        }}
                      />
                    </div>
                    <div className="p-5">
                      <h2 className="mb-2 font-display text-lg font-bold text-foreground">{p.name}</h2>
                      <p className="mb-4 text-sm text-muted-foreground">{p.summary ?? ""}</p>
                      <div className="inline-block font-display text-sm font-semibold text-accent transition-colors group-hover:text-accent/80">
                        View Details →
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default ProductCategoryPage;
