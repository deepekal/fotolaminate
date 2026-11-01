"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQSection from "@/components/FAQSection";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api, ProductRecord } from "@/lib/api";
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

const WHATSAPP_PHONE = "919873684816";
const CALL_PHONE_E164 = "+919873684816";

import { slugifyCategory } from "@/lib/slug";

type ProductDetailPageProps = {
  initialProduct?: ProductRecord | null;
  relatedProducts?: ProductRecord[];
};

const ProductDetailPage = ({
  initialProduct = null,
  relatedProducts = [],
}: ProductDetailPageProps) => {
  const params = useParams<{ slug?: string | string[] }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const [product, setProduct] = useState<ProductRecord | null>(initialProduct);
  const [loading, setLoading] = useState(!initialProduct);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!slug || initialProduct) return;
      setLoading(true);
      try {
        const p = await api.products.getBySlug(slug);
        if (active) setProduct(p);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load product");
        if (active) setProduct(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [slug, initialProduct]);

  const specsEntries = useMemo(() => {
    if (!product?.specs || typeof product.specs !== "object") return [];
    const obj = product.specs as Record<string, unknown>;
    return Object.entries(obj);
  }, [product]);

  return (
    <>
      <Navbar />

      <header className="gradient-navy pt-28 pb-10">
        <div className="container-max px-4 md:px-8 lg:px-16">
          <div className="max-w-5xl">
            <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-sm text-primary-foreground/70">
              <Link href="/" className="transition-colors hover:text-accent">
                Home
              </Link>
              <span>/</span>
              <Link href="/products" className="transition-colors hover:text-accent">
                Products
              </Link>
              {product?.category && (
                <>
                  <span>/</span>
                  <Link
                    href={`/products/category/${slugifyCategory(product.category)}`}
                    className="transition-colors hover:text-accent"
                  >
                    {product.category}
                  </Link>
                </>
              )}
              <span>/</span>
              <span className="text-primary-foreground font-medium truncate max-w-xs">{product?.name ?? "Details"}</span>
            </nav>

            {loading ? (
              <h1 className="font-display text-4xl font-bold text-primary-foreground">Loading…</h1>
            ) : product ? (
              <>
                {product.category && (
                  <Link
                    href={`/products/category/${slugifyCategory(product.category)}`}
                    className="mb-3 inline-block rounded-full border border-accent/40 bg-accent/10 px-4 py-1 font-display text-sm font-semibold tracking-wider text-accent transition-colors hover:bg-accent/20"
                  >
                    {product.category}
                  </Link>
                )}
                <h1 className="mb-3 font-display text-4xl font-bold leading-tight text-primary-foreground md:text-5xl">
                  {product.name}
                </h1>
                <p className="text-sm leading-relaxed text-primary-foreground/75">
                  {product.summary ?? ""}
                </p>
              </>
            ) : (
              <h1 className="font-display text-4xl font-bold text-primary-foreground">Product not found</h1>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="section-padding bg-white">
          <div className="container-max">
            {!loading && product && (
              <div className="grid gap-8 lg:grid-cols-12">
                <div className="min-w-0 lg:col-span-5">
                  <div className="overflow-hidden rounded-lg border border-border bg-white shadow-industrial">
                    <img
                      src={product.cover_image_url || getCategoryFallback(product.category)}
                      alt={product.name}
                      className="h-80 w-full object-contain"
                      fetchPriority="high"
                      onError={(e) => {
                        e.currentTarget.src = getCategoryFallback(product.category);
                      }}
                    />
                  </div>

                  {product.gallery_image_urls?.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {product.gallery_image_urls.slice(0, 6).map((u) => (
                        <div key={u} className="overflow-hidden rounded-md border border-border bg-white">
                          <img
                            src={u}
                            alt="Gallery"
                            className="h-24 w-full object-contain"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = getCategoryFallback(product.category);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="min-w-0 lg:col-span-7">
                  <div className="rounded-lg border border-border bg-white p-6 shadow-industrial md:p-8">
                    <h2 className="mb-3 font-display text-2xl font-bold text-foreground">Product Description</h2>
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground text-justify">
                      {product.description || product.summary || "This high-performance machine is engineered for precision and industrial durability, ensuring consistent results for professional media finishing."}
                    </p>

                    {(product.features?.length > 0 || specsEntries.length > 0) && (
                      <div className="mt-8 space-y-8">
                        {product.features?.length > 0 && (
                          <div>
                            <h3 className="mb-3 font-display text-lg font-bold text-foreground">Key Features</h3>
                            <ul className="grid gap-3 sm:grid-cols-2">
                              {product.features.map((f) => (
                                <li key={f} className="flex items-start gap-2 rounded-md bg-muted p-3 text-sm text-foreground">
                                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {specsEntries.length > 0 && (
                          <div>
                            <h3 className="mb-3 font-display text-lg font-bold text-foreground">Technical Specifications</h3>
                            <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
                              {specsEntries.map(([k, v]) => (
                                <div key={k} className="flex items-center justify-between gap-6 bg-muted/30 px-4 py-3 even:bg-white">
                                  <span className="text-sm font-medium text-muted-foreground">{k}</span>
                                  <span className="text-right text-sm font-bold text-foreground">
                                    {typeof v === "string" || typeof v === "number" ? String(v) : JSON.stringify(v)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-8 rounded-lg gradient-navy p-6 text-primary-foreground">
                      <h3 className="mb-2 font-display text-xl font-bold">Request pricing and availability</h3>
                      <p className="mb-5 text-sm text-primary-foreground/70">
                        Send your application details and expected volume. We will share a suitable configuration and a
                        quotation.
                      </p>

                      <div className="flex flex-wrap gap-3">
                        <a
                          href={`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
                            `Hi! I am here to enquire about ${product.name}. Please share price, specifications, availability, and delivery time.`,
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-md gradient-accent px-5 py-3 font-display text-sm font-bold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90"
                        >
                          WhatsApp Enquire
                        </a>

                        <a
                          href={`tel:${CALL_PHONE_E164}`}
                          className="inline-flex items-center justify-center rounded-md border border-primary-foreground/30 px-5 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:border-accent hover:text-accent"
                        >
                          Call
                        </a>

                        <Link
                          href="/contact"
                          className="inline-flex items-center justify-center rounded-md bg-primary-foreground/10 px-5 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary-foreground/15"
                        >
                          Contact us
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Product Video Section — only shown when admin has set a video_url */}
            {!loading && product && product.video_url && (
              <div className="mt-10">
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-block h-1 w-8 rounded-full bg-accent" />
                  <h2 className="font-display text-2xl font-bold text-foreground">Product Video</h2>
                </div>

                <div className="overflow-hidden rounded-xl border border-border shadow-industrial">
                  {(() => {
                    const ytMatch = product.video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
                    if (ytMatch && ytMatch[1]) {
                      return (
                        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                          <iframe
                            src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                            title={`${product.name} – Product Video`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            loading="lazy"
                            className="absolute inset-0 h-full w-full border-0"
                          />
                        </div>
                      );
                    }
                    return (
                      <video
                        src={product.video_url}
                        controls
                        className="w-full rounded-xl bg-black"
                        title={`${product.name} – Product Video`}
                      >
                        Your browser does not support the video tag.
                      </video>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Page-specific FAQ section — only renders when this product has FAQs */}
            {!loading && product && product.faqs && product.faqs.length > 0 && (
              <div className="mt-8">
                <FAQSection faqs={product.faqs} />
              </div>
            )}

            {/* Related Products Section for strategic internal linking & user navigation */}
            {!loading && product && relatedProducts.length > 0 && (
              <div className="mt-12">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="inline-block h-1 w-8 rounded-full bg-accent" />
                    <h2 className="font-display text-2xl font-bold text-foreground">
                      Related {product.category ? `${product.category} ` : ""}Machines
                    </h2>
                  </div>
                  {product.category && (
                    <Link
                      href={`/products/category/${slugifyCategory(product.category)}`}
                      className="font-display text-sm font-semibold text-accent transition-colors hover:text-accent/80"
                    >
                      View all {product.category} →
                    </Link>
                  )}
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedProducts.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/products/${rel.slug}`}
                      className="group overflow-hidden rounded-lg border border-border bg-white shadow-industrial hover-lift transition-all"
                    >
                      <div className="relative h-44 overflow-hidden bg-white p-3">
                        <img
                          src={rel.cover_image_url || getCategoryFallback(rel.category)}
                          alt={rel.name}
                          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = getCategoryFallback(rel.category);
                          }}
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="mb-1 font-display text-base font-bold text-foreground group-hover:text-accent transition-colors">
                          {rel.name}
                        </h3>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {rel.summary || "Explore high-precision finishing specs and details."}
                        </p>
                        <div className="mt-3 inline-block font-display text-xs font-semibold text-accent">
                          View Specs →
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {!loading && !product && (
              <div className="rounded-lg border border-border bg-muted p-8 text-center text-sm text-muted-foreground">
                No product found for this slug.
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default ProductDetailPage;
