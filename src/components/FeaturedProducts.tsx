"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, ProductRecord } from "@/lib/api";
import fallbackImg from "@/assets/product-photo.jpg";
import coldImg from "@/assets/product-cold.jpg";
import rollImg from "@/assets/product-roll.jpg";
import Image, { type StaticImageData } from "next/image";
import { canOptimize } from "@/lib/image-src";

type FeaturedProductsProps = {
  enquireHref?: string;
  /** Rendered on the server so the list doesn't have to be fetched again. */
  initialProducts?: ProductRecord[];
};

// Static fallback products shown when API/DB is unavailable
const STATIC_FALLBACK: ProductRecord[] = [
  {
    id: "static-1",
    name: "Cold Lamination Machine",
    slug: "cold-lamination-machine",
    category: "Cold Lamination",
    summary: "Pressure-based lamination for heat-sensitive photos, prints, and documents.",
    description: "Professional cold lamination machine designed for photo studios and printing businesses.",
    features: ["Adjustable pressure rollers", "Supports PVC & BOPP films", "No warm-up time required"],
    specs: {},
    meta_title: null,
    meta_description: null,
    keywords: [],
    cover_image_url: null,
    og_image_url: null,
    gallery_image_urls: [],
    video_url: null,
    published: true,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
  {
    id: "static-2",
    name: "Canvera Photo Album Machine",
    slug: "canvera-photo-album-machine",
    category: "Album Making",
    summary: "Precision album making machine for Canvera format photo books.",
    description: "Designed for studios producing high-quality Canvera photo albums at production speed.",
    features: ["Consistent pressing pressure", "Soft & hard cover support", "Medium-volume production"],
    specs: {},
    meta_title: null,
    meta_description: null,
    keywords: [],
    cover_image_url: null,
    og_image_url: null,
    gallery_image_urls: [],
    video_url: null,
    published: true,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
  {
    id: "static-3",
    name: "UV Coating Machine",
    slug: "uv-coating-machine",
    category: "UV Coating",
    summary: "High-gloss UV coating for visiting cards, book covers, and premium packaging.",
    description: "UV coating machine that delivers a hard, scratch-resistant gloss finish with instant UV curing.",
    features: ["Instant UV curing", "Gloss & matte coatings", "Suitable for paper & card stock"],
    specs: {},
    meta_title: null,
    meta_description: null,
    keywords: [],
    cover_image_url: null,
    og_image_url: null,
    gallery_image_urls: [],
    video_url: null,
    published: true,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
];

const STATIC_IMAGES: Record<string, StaticImageData> = {
  "static-1": coldImg as StaticImageData,
  "static-2": fallbackImg as StaticImageData,
  "static-3": rollImg as StaticImageData,
};

const FeaturedProducts = ({ enquireHref = "/contact", initialProducts }: FeaturedProductsProps) => {
  const hasInitial = Boolean(initialProducts?.length);
  const [loading, setLoading] = useState(!hasInitial);
  const [products, setProducts] = useState<ProductRecord[]>(hasInitial ? initialProducts!.slice(0, 3) : []);

  useEffect(() => {
    if (hasInitial) return;
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const list = await api.products.list();
        const published = list.filter((p) => p.published);
        if (active) setProducts(published.length > 0 ? published.slice(0, 3) : STATIC_FALLBACK);
      } catch {
        if (active) setProducts(STATIC_FALLBACK);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const cards = useMemo(() => {
    return products.map((p) => {
      const featurePreview = (p.features ?? []).filter(Boolean).slice(0, 2).join(", ");
      const staticImg = STATIC_IMAGES[p.id];
      return {
        key: p.id,
        name: p.name,
        img: p.cover_image_url ?? staticImg ?? fallbackImg,
        slug: p.slug,
        specs: [
          { label: "Category", value: p.category ?? "—" },
          { label: "Summary", value: p.summary ?? "—" },
          { label: "Features", value: featurePreview || "—" },
        ],
      };
    });
  }, [products]);

  return (
    <section className="section-padding bg-white">
      <div className="container-max">
        <div className="mb-12 text-center">
          <span className="mb-2 inline-block font-display text-sm font-bold uppercase tracking-widest text-accent">
            Best Sellers
          </span>
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">Featured Machines</h2>
        </div>

        {loading ? (
          <div className="grid gap-8 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-border bg-white">
                <div className="h-56 bg-muted" />
                <div className="space-y-3 p-5">
                  <div className="h-6 w-2/3 rounded bg-muted" />
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-5/6 rounded bg-muted" />
                  <div className="h-10 w-full rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-3">
            {cards.map((p, i) => (
              <motion.div
                key={p.key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="group overflow-hidden rounded-lg border border-border bg-white hover-lift"
              >
                <div className="relative h-56 overflow-hidden bg-white">
                  <Image
                    src={typeof p.img === "string" ? p.img : (p.img as { src: string }).src}
                    alt={p.name}
                    fill
                    sizes="(min-width: 768px) 400px, 100vw"
                    className="object-contain"
                    unoptimized={!canOptimize(typeof p.img === "string" ? p.img : (p.img as { src: string }).src)}
                    onError={(e) => {
                      e.currentTarget.src = typeof fallbackImg === "string" ? fallbackImg : fallbackImg.src;
                    }}
                  />
                  <div className="absolute top-3 left-3 rounded bg-accent px-3 py-1 font-display text-xs font-bold text-accent-foreground">
                    BEST SELLER
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="mb-3 font-display text-xl font-bold text-foreground">{p.name}</h3>
                  <div className="mb-4 space-y-2">
                    {p.specs.map((s) => (
                      <div key={s.label} className="flex justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">{s.label}</span>
                        <span className="truncate font-semibold text-foreground" title={s.value}>
                          {s.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/products/${p.slug}`}
                      className="flex-1 rounded-md border border-border py-2.5 text-center font-display text-sm font-bold text-foreground transition-colors hover:border-accent hover:text-accent"
                    >
                      View Details
                    </Link>
                    {enquireHref.startsWith("/") ? (
                      <Link
                        href={enquireHref}
                        className="flex-1 rounded-md gradient-navy py-2.5 text-center font-display text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
                      >
                        Enquire Now
                      </Link>
                    ) : (
                      <a
                        href={enquireHref}
                        className="flex-1 rounded-md gradient-navy py-2.5 text-center font-display text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
                      >
                        Enquire Now
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
