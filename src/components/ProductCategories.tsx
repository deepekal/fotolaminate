"use client";

import { motion } from "framer-motion";
import photoImg from "@/assets/product-photo.jpg";
import rollImg from "@/assets/product-roll.jpg";
import hotImg from "@/assets/product-hot.jpg";
import coldImg from "@/assets/product-cold.jpg";
import industrialImg from "@/assets/product-industrial.jpg";
import Link from "next/link";
import type { StaticImageData } from "next/image";
import { useEffect, useMemo, useState } from "react";
import { api, type ProductRecord } from "@/lib/api";
import { slugifyCategory } from "@/lib/slug";
import { toast } from "sonner";

const categories = [
  { title: "Cold Lamination Machine", desc: "Pressure-based lamination for heat-sensitive materials.", img: coldImg },
  { title: "Canvera Photo Album Making Machine", desc: "Album making solutions designed for consistent output.", img: photoImg },
  { title: "Karizma Photo Album Making Machine", desc: "Professional album making machines for production workflows.", img: rollImg },
  { title: "Photo Frame Cutting Machine", desc: "Accurate cutting for photo frames and finishing.", img: industrialImg },
  { title: "Hot Gluing Machine", desc: "Reliable gluing for album and finishing processes.", img: hotImg },
  { title: "Grooving Machine", desc: "Clean grooves for professional binding and finishing.", img: industrialImg },
  { title: "UV Coating Machine", desc: "Coating solutions for improved surface protection and finish.", img: photoImg },
  { title: "Round Corner Cutter Machine", desc: "Rounded corners for cleaner, safer finished products.", img: coldImg },
  { title: "PVC Cold Lamination Roll", desc: "PVC cold lamination rolls for common lamination applications.", img: rollImg },
];

export type ProductCategoryItem = {
  title: string;
  desc?: string;
  img?: string | StaticImageData;
  href: string;
};

type ProductCategoriesProps = {
  detailsHref?: string;
  items?: ProductCategoryItem[];
  detailsLabel?: string;
  useDb?: boolean;
  initialDbProducts?: ProductRecord[];
};

function getFallbackImage(title: string) {
  const t = title.toLowerCase();
  if (t.includes("cold")) return coldImg;
  if (t.includes("thermal") || t.includes("hot")) return hotImg;
  if (t.includes("uv")) return photoImg;
  if (t.includes("glue")) return hotImg;
  if (t.includes("album") || t.includes("canvera") || t.includes("karizma")) return rollImg;
  if (t.includes("frame")) return industrialImg;
  if (t.includes("cut")) return photoImg;
  if (t.includes("groov")) return industrialImg;
  return industrialImg;
}

function normalizeImageSrc(img: string | StaticImageData) {
  return typeof img === "string" ? img : img.src;
}

const ProductCategories = ({
  detailsHref = "/products",
  items,
  detailsLabel = "View Details →",
  useDb = false,
  initialDbProducts,
}: ProductCategoriesProps) => {
  const [dbProducts, setDbProducts] = useState<ProductRecord[] | null>(initialDbProducts ?? null);
  const [loadingDb, setLoadingDb] = useState(() => Boolean(useDb && !(items && items.length) && !initialDbProducts));
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    if (!useDb || (items && items.length) || initialDbProducts) return;
    let active = true;
    async function load() {
      setLoadingDb(true);
      setDbError(null);
      try {
        const list = await api.products.list();
        if (active) setDbProducts(list.filter((p) => p.published));
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to load categories";
        toast.error(message);
        if (active) {
          setDbProducts([]);
          setDbError(message);
        }
      } finally {
        if (active) setLoadingDb(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [useDb, items]);

  const dbItems: ProductCategoryItem[] | null = useMemo(() => {
    if (!useDb || dbProducts === null) return null;

    const map = new Map<string, ProductRecord[]>();
    for (const p of dbProducts) {
      const key = (p.category ?? "").trim() || "Other";
      const arr = map.get(key);
      if (arr) arr.push(p);
      else map.set(key, [p]);
    }

    const entries = Array.from(map.entries());
    entries.sort(([a], [b]) => {
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      return a.localeCompare(b);
    });

    return entries.map(([category, list]) => {
      const img = list.find((p) => Boolean(p.cover_image_url))?.cover_image_url ?? undefined;
      return {
        title: category,
        desc: `${list.length} models`,
        img,
        href: `/products/category/${slugifyCategory(category)}`,
      };
    });
  }, [useDb, dbProducts]);

  const list: ProductCategoryItem[] =
    items && items.length
      ? items
      : dbItems && dbItems.length > 0
        ? dbItems
        : categories.map((cat) => ({
            title: cat.title,
            desc: cat.desc,
            img: cat.img,
            href: `/products/category/${slugifyCategory(cat.title)}`,
          }));

  return (
  <section id="products" className="section-padding bg-muted">
    <div className="container-max">
      <div className="mb-12 text-center">
        <span className="mb-2 inline-block font-display text-sm font-bold uppercase tracking-widest text-accent">
          Our Products
        </span>
        <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
          Product Categories
        </h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loadingDb && list.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted p-6 text-sm text-muted-foreground shadow-industrial">
            Loading categories…
          </div>
        ) : null}

        {!loadingDb && list.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted p-6 text-sm text-muted-foreground shadow-industrial">
            {dbError
              ? dbError
              : useDb
                ? "No categories available."
                : "No categories."}
          </div>
        ) : null}
        {list.map((cat, i) => (
          <motion.div
            key={cat.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="group overflow-hidden rounded-lg bg-white shadow-industrial hover-lift"
          >
            <div className="relative h-52 overflow-hidden">
              <img
                src={normalizeImageSrc(cat.img ?? getFallbackImage(cat.title))}
                alt={cat.title}
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </div>
            <div className="p-5">
              <h3 className="mb-2 font-display text-lg font-bold text-foreground">{cat.title}</h3>
              {cat.desc ? <p className="mb-4 text-sm text-muted-foreground">{cat.desc}</p> : null}
              {cat.href.startsWith("/") ? (
                <Link
                  href={cat.href}
                  className="inline-block font-display text-sm font-semibold text-accent transition-colors hover:text-accent/80"
                >
                  {detailsLabel}
                </Link>
              ) : (
                <a
                  href={cat.href}
                  className="inline-block font-display text-sm font-semibold text-accent transition-colors hover:text-accent/80"
                >
                  {detailsLabel}
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
  );
};

export default ProductCategories;
