import ProductDetailPage from "@/screens/ProductDetail";

import type { Metadata } from "next";
import { query } from "@server/lib/db";

type ProductMetaRow = {
  name: string;
  summary: string | null;
  description: string;
  category: string | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string[];
  cover_image_url: string | null;
  og_image_url: string | null;
};

export const runtime = "nodejs";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  try {
    const r = await query<ProductMetaRow>(
      "select name, summary, description, category, meta_title, meta_description, keywords, cover_image_url, og_image_url from public.products where published = true and slug = $1 limit 1",
      [slug],
    );

    const p = r.rows[0];
    if (!p) {
      return {
        title: "Product",
        robots: { index: false, follow: false },
      };
    }

    const title = p.meta_title?.trim() || p.name;
    const description =
      (p.meta_description?.trim() || p.summary?.trim() || p.description?.trim() || `Explore ${p.name} by Foto Laminate Precision.`).slice(0, 160);
    const CANONICAL_BASE = "https://www.fotolaminate.com";
    const raw = p.og_image_url || p.cover_image_url || null;
    const image = raw && /^https?:\/\//i.test(raw) ? raw : raw ? `${CANONICAL_BASE}${raw.startsWith("/") ? "" : "/"}${raw}` : null;
    
    const baseKeywords = [
      "Foto Laminate Precision",
      "lamination machine",
      ...(p.category ? [p.category] : []),
      p.name,
    ];
    
    const keywords = p.keywords && p.keywords.length > 0 ? p.keywords : baseKeywords;
    
    return {
      title,
      description,
      keywords,
      alternates: { canonical: `/products/${slug}` },
      openGraph: {
        type: "article",
        title,
        description,
        url: `/products/${slug}`,
        ...(image ? { images: [{ url: image, alt: p.name }] } : {}),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        ...(image ? { images: [image] } : {}),
      },
    };
  } catch {
    return {
      title: "Product",
      alternates: { canonical: `/products/${slug}` },
    };
  }
}

import type { ProductRecord } from "@/lib/api";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  let productSchemaJson: string | null = null;
  let initialProduct: ProductRecord | null = null;

  const CANONICAL_BASE = "https://www.fotolaminate.com";

  /** Ensures image URLs in structured data are always absolute. */
  function toAbsoluteUrl(url: string | null | undefined): string | null {
    if (!url?.trim()) return null;
    if (/^https?:\/\//i.test(url)) return url;
    return `${CANONICAL_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
  }

  try {
    const r = await query<ProductRecord>(
      "select * from public.products where published = true and slug = $1 limit 1",
      [slug]
    );
    const p = r.rows[0];
    if (p) {
      initialProduct = p;

      // Use the real product image; never fall back to favicon
      const image = toAbsoluteUrl(p.og_image_url || p.cover_image_url);

      // Prefer the short summary for schema description; fall back to a
      // truncated version of the full description to keep it concise.
      const rawDesc = (p.summary?.trim() || p.description?.trim() || p.name).slice(0, 300);

      const productUrl = `${CANONICAL_BASE}/products/${slug}`;

      const graphNodes: object[] = [
        {
          "@type": "Product",
          "@id": `${productUrl}/#product`,
          "name": p.name,
          ...(image ? { "image": image } : {}),
          "description": rawDesc,
          "url": productUrl,
          "brand": {
            "@type": "Brand",
            "name": "Foto Laminate Precision"
          },
          "manufacturer": {
            "@type": "Organization",
            "name": "Foto Laminate Precision"
          },
          "offers": {
            "@type": "Offer",
            "url": productUrl,
            "priceCurrency": "INR",
            "availability": "https://schema.org/InStock"
          }
        }
      ];

      // Only include FAQPage when FAQs are actually visible on the page
      if (p.faqs && Array.isArray(p.faqs) && p.faqs.length > 0) {
        graphNodes.push({
          "@type": "FAQPage",
          "mainEntity": p.faqs.map((faq: { q: string; a: string }) => ({
            "@type": "Question",
            "name": faq.q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.a
            }
          }))
        });
      }

      productSchemaJson = JSON.stringify({
        "@context": "https://schema.org",
        "@graph": graphNodes
      });
    }
  } catch (e) {
    // Ignore error, schema will just not be rendered
  }

  let relatedProducts: ProductRecord[] = [];
  if (initialProduct?.category) {
    try {
      const relRes = await query<ProductRecord>(
        "select * from public.products where published = true and category = $1 and slug != $2 order by created_at desc limit 3",
        [initialProduct.category, slug]
      );
      relatedProducts = relRes.rows;
    } catch (e) {}
  }

  return (
    <>
      {productSchemaJson && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: productSchemaJson }}
        />
      )}
      <ProductDetailPage initialProduct={initialProduct} relatedProducts={relatedProducts} />
    </>
  );
}
