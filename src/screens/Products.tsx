"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ClipboardList, Gauge, ThermometerSun, Settings, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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

const ALL = "all";

type ProductsPageProps = {
  initialProducts?: ProductRecord[];
};

const ProductCard = ({ product }: { product: ProductRecord }) => (
  <Link
    href={`/products/${product.slug}`}
    className="group flex flex-col overflow-hidden rounded-lg border border-border bg-white shadow-industrial hover-lift"
  >
    <div className="relative flex h-44 items-center justify-center overflow-hidden bg-white p-3">
      <img
        src={product.cover_image_url || getCategoryFallback(product.category)}
        alt={product.name}
        className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.src = getCategoryFallback(product.category);
        }}
      />
    </div>
    <div className="flex flex-1 flex-col border-t border-border p-4">
      <h3 className="mb-1 font-display text-base font-bold leading-snug text-foreground transition-colors group-hover:text-accent">
        {product.name}
      </h3>
      {product.summary ? (
        <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{product.summary}</p>
      ) : null}
      <div className="mt-auto font-display text-sm font-semibold text-accent">View details →</div>
    </div>
  </Link>
);

const ProductsPage = ({ initialProducts = [] }: ProductsPageProps) => {
  const [products, setProducts] = useState<ProductRecord[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [activeCategory, setActiveCategory] = useState<string>(ALL);
  const [search, setSearch] = useState("");
  const resultsRef = useRef<HTMLElement | null>(null);

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

  // Keep the selected category in the URL (?category=<slug>) so a filtered view can be shared.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("category");
    if (slug && productsByCategory.some(([c]) => slugifyCategory(c) === slug)) setActiveCategory(slug);
  }, [productsByCategory]);

  const selectCategory = (slug: string) => {
    setActiveCategory(slug);
    const url = new URL(window.location.href);
    if (slug === ALL) url.searchParams.delete("category");
    else url.searchParams.set("category", slug);
    window.history.replaceState(null, "", url.toString());

    // If the visitor has scrolled past the top of the results, bring them back to it.
    const results = resultsRef.current;
    if (results && results.getBoundingClientRect().top < 0) {
      results.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const visibleGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return productsByCategory
      .filter(([category]) => activeCategory === ALL || slugifyCategory(category) === activeCategory)
      .map(([category, list]) => {
        const matches = q
          ? list.filter((p) => `${p.name} ${p.category ?? ""} ${p.summary ?? ""}`.toLowerCase().includes(q))
          : list;
        return [category, matches] as [string, ProductRecord[]];
      })
      .filter(([, list]) => list.length > 0);
  }, [productsByCategory, activeCategory, search]);

  const visibleCount = visibleGroups.reduce((n, [, list]) => n + list.length, 0);

  const chipClass = (active: boolean) =>
    `shrink-0 rounded-full border px-4 py-2 text-xs lg:px-3 lg:py-1.5 font-semibold transition-colors ${
      active
        ? "border-accent bg-accent text-accent-foreground"
        : "border-border bg-white text-foreground hover:border-accent hover:text-accent"
    }`;

  return (
    <>
      <Navbar />

    <header className="gradient-navy pt-28 pb-12">
      <div className="container-max">
        <div className="max-w-3xl">
          <span className="mb-3 inline-block rounded-full border border-accent/40 bg-accent/10 px-4 py-1 font-display text-sm font-semibold tracking-wider text-accent">
            Products
          </span>
          <h1 className="mb-4 font-display text-4xl font-bold leading-tight text-primary-foreground md:text-5xl">
            All Products
          </h1>
          <p className="text-lg text-primary-foreground/75">
            {products.length > 0
              ? `${products.length} machines and accessories across ${productsByCategory.length} categories. `
              : ""}
            For a recommendation, share your media size, film type, and expected daily volume.
          </p>
        </div>
      </div>
    </header>

    <main>
      <div className="sticky top-16 z-30 border-b border-border bg-white/95 shadow-sm backdrop-blur lg:top-[76px]">
        <div className="container-max flex flex-col gap-3 py-3 lg:flex-row lg:items-center">
          <div className="relative lg:w-52 lg:shrink-0">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
              className="w-full rounded-full border border-border bg-muted py-2 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:gap-1.5 lg:overflow-visible lg:pb-0">
            <button type="button" onClick={() => selectCategory(ALL)} className={chipClass(activeCategory === ALL)}>
              All ({products.length})
            </button>
            {productsByCategory.map(([category, list]) => {
              const slug = slugifyCategory(category);
              return (
                <button key={category} type="button" onClick={() => selectCategory(slug)} className={chipClass(activeCategory === slug)}>
                  {category} ({list.length})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <section ref={resultsRef} className="scroll-mt-[192px] bg-muted py-12 lg:scroll-mt-[204px]">
        <div className="container-max">
          {loading ? (
            <div className="rounded-lg border border-border bg-white p-6 text-sm text-muted-foreground shadow-industrial">
              Loading…
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-border bg-white p-6 text-sm text-muted-foreground shadow-industrial">
              No products published yet.
            </div>
          ) : visibleCount === 0 ? (
            <div className="rounded-lg border border-border bg-white p-8 text-center text-sm text-muted-foreground shadow-industrial">
              No products match “{search}”.{" "}
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  selectCategory(ALL);
                }}
                className="font-semibold text-accent hover:underline"
              >
                Show all products
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              {visibleGroups.map(([category, list]) => (
                <section key={category} id={slugifyCategory(category)} className="scroll-mt-48">
                  <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
                    <h2 className="font-display text-2xl font-bold text-foreground">
                      {category}{" "}
                      <span className="text-base font-medium text-muted-foreground">({list.length})</span>
                    </h2>
                    <Link
                      href={`/products/category/${slugifyCategory(category)}`}
                      className="font-display text-sm font-semibold text-accent hover:text-accent/80"
                    >
                      Category page →
                    </Link>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {list.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section-padding bg-white">
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

      <section id="request-quote" className="section-padding bg-muted">
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
