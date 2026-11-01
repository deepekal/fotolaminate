"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCategories, { type ProductCategoryItem } from "@/components/ProductCategories";
import FeaturedProducts from "@/components/FeaturedProducts";
import Link from "next/link";
import { ClipboardList, Gauge, ThermometerSun, Settings } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api, ProductRecord } from "@/lib/api";
import { toast } from "sonner";
import { slugifyCategory } from "@/lib/slug";
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

type ProductsPageProps = {
  initialProducts?: ProductRecord[];
};

const ProductsPage = ({ initialProducts = [] }: ProductsPageProps) => {
  const [products, setProducts] = useState<ProductRecord[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);

  useEffect(() => {
    if (initialProducts.length > 0) return;
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const list = await api.products.list();
        if (active) setProducts(list.filter((p) => p.published));
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
  }, []);

  const productsByCategory = useMemo(() => {
    const map = new Map<string, ProductRecord[]>();
    for (const p of products) {
      const key = (p.category ?? "").trim() || "Other";
      const list = map.get(key);
      if (list) list.push(p);
      else map.set(key, [p]);
    }

    const entries = Array.from(map.entries());
    entries.sort(([a], [b]) => {
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      return a.localeCompare(b);
    });

    const coldSequence = ["fully auto", "semi auto", "professional", "manual", "economy"];

    for (const [category, list] of entries) {
      if (category.toLowerCase().includes("cold lamination")) {
        list.sort((a, b) => {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          let aIndex = coldSequence.findIndex(seq => aName.includes(seq));
          let bIndex = coldSequence.findIndex(seq => bName.includes(seq));
          if (aIndex === -1) aIndex = 999;
          if (bIndex === -1) bIndex = 999;
          if (aIndex !== bIndex) return aIndex - bIndex;
          return a.name.localeCompare(b.name);
        });
      } else {
        list.sort((a, b) => a.name.localeCompare(b.name));
      }
    }

    return entries;
  }, [products]);

  const categoryItems: ProductCategoryItem[] = useMemo(() => {
    return productsByCategory.map(([category, list]) => {
      const href = `/products/category/${slugifyCategory(category)}`;
      return {
        title: category,
        desc: `${list.length} models`,
        img: list.find((p) => Boolean(p.cover_image_url))?.cover_image_url ?? undefined,
        href,
      };
    });
  }, [productsByCategory]);

  return (
    <>
      <Navbar />

    <header className="gradient-navy pt-28 pb-16">
      <div className="container-max px-4 md:px-8 lg:px-16">
        <div className="max-w-3xl">
          <span className="mb-3 inline-block rounded-full border border-accent/40 bg-accent/10 px-4 py-1 font-display text-sm font-semibold tracking-wider text-accent">
            Products
          </span>
          <h1 className="mb-4 font-display text-4xl font-bold leading-tight text-primary-foreground md:text-5xl">
            Machines designed for professional lamination output
          </h1>
          <p className="text-lg text-primary-foreground/75">
            Explore categories and best-selling models. For a recommendation, share your media size, film type, and
            expected daily volume.
          </p>
        </div>
      </div>
    </header>

    <main>
      <ProductCategories items={categoryItems} detailsLabel="Browse models →" />
      <FeaturedProducts enquireHref="/contact" />

      <section className="section-padding bg-white">
        <div className="container-max">
          <div className="mb-10 text-center">
            <span className="mb-2 inline-block font-display text-sm font-bold uppercase tracking-widest text-accent">
              Categories
            </span>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">Browse models by category</h2>
          </div>

          {loading ? (
            <div className="rounded-lg border border-border bg-muted p-6 text-sm text-muted-foreground shadow-industrial">
              Loading…
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-border bg-muted p-6 text-sm text-muted-foreground shadow-industrial">
              No products published yet.
            </div>
          ) : (
            <div className="space-y-16">
              {/* Specific Series: Cold Lamination */}
              <section className="space-y-8">
                <div className="text-center">
                  <h3 className="font-display text-3xl font-bold text-foreground">Cold Lamination Machine Series</h3>
                  <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
                    Available in three distinct models to suit different production scales and automation needs.
                  </p>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                  {[
                    { title: "Fully Auto Model", desc: "Maximum throughput with automatic feeding and finishing." },
                    { title: "Semi Auto Model", desc: "Balanced automation for mid-to-high volume workflows." },
                    { title: "Professional Model", desc: "Heavy-duty construction for consistent precision output." }
                  ].map((m) => (
                    <div key={m.title} className="rounded-lg border border-border bg-white p-6 shadow-industrial hover-lift">
                      <div className="mb-4 h-40 overflow-hidden rounded-md bg-muted">
                        <img src={coldImg.src} alt={m.title} className="h-full w-full object-contain" />
                      </div>
                      <h4 className="mb-2 font-display text-xl font-bold text-foreground">{m.title}</h4>
                      <p className="text-sm text-muted-foreground">{m.desc}</p>
                      <Link href="/products/category/cold-lamination-machine" className="mt-4 inline-block font-display text-sm font-semibold text-accent hover:text-accent/80">
                        View Models →
                      </Link>
                    </div>
                  ))}
                </div>
              </section>

              <div className="h-px bg-border" />

              {productsByCategory.map(([category, list]) => (
                <section key={category} className="space-y-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-display text-2xl font-bold text-foreground">{category}</h3>
                    <div className="text-sm text-muted-foreground">{list.length} models</div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((p) => (
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
                          <h4 className="mb-2 font-display text-lg font-bold text-foreground">{p.name}</h4>
                          <p className="mb-4 text-sm text-muted-foreground">{p.summary ?? ""}</p>
                          <div className="inline-block font-display text-sm font-semibold text-accent transition-colors group-hover:text-accent/80">
                            View Details →
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section-padding bg-muted">
        <div className="container-max">
          <div className="mb-10 text-center">
            <span className="mb-2 inline-block font-display text-sm font-bold uppercase tracking-widest text-accent">
              Selection Guide
            </span>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">How to choose a model</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: ClipboardList,
                title: "Media Width",
                desc: "Choose width based on your largest regular job to avoid trimming and rework.",
              },
              {
                icon: ThermometerSun,
                title: "Film Type",
                desc: "Hot and cold films behave differently; match the machine to your film and media.",
              },
              {
                icon: Gauge,
                title: "Speed and Volume",
                desc: "Throughput depends on speed, warm-up time, and how fast an operator can feed consistently.",
              },
              {
                icon: Settings,
                title: "Service and Spares",
                desc: "Prefer models with predictable maintenance and accessible spare parts.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-lg border border-border bg-card p-6 shadow-industrial">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg gradient-accent text-accent-foreground">
                  <Icon size={20} />
                </div>
                <h3 className="mb-2 font-display text-lg font-bold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="request-quote" className="section-padding bg-white">
        <div className="container-max">
          <div className="rounded-lg gradient-navy p-8 text-primary-foreground shadow-industrial md:p-10">
            <div className="grid items-center gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h2 className="mb-3 font-display text-3xl font-bold">Request pricing and specifications</h2>
                <p className="text-sm leading-relaxed text-primary-foreground/70">
                  Tell us what you laminate and your daily volume. We will share the right category, recommended
                  width, and a quotation.
                </p>
              </div>
              <div className="flex justify-start lg:justify-end">
                <Link
                  href="/contact"
                  className="rounded-md gradient-accent px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90"
                >
                  Send inquiry
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

export default ProductsPage;
