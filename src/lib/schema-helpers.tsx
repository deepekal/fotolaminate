import type { PageContent, PageFAQ } from "@/lib/page-types";

/**
 * Builds an array of JSON-LD schema strings from a page's custom schemas and FAQs.
 * Appends an FAQPage schema if the page has top-level FAQs.
 */
export function buildPageSchemas(page: PageContent | null | undefined): string[] {
  const schemas: unknown[] = Array.isArray(page?.schemas) ? [...page.schemas] : [];

  if (page?.faqs && Array.isArray(page.faqs) && page.faqs.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": page.faqs.map((faq: PageFAQ) => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.a,
        },
      })),
    });
  }

  return schemas.map((schema) =>
    typeof schema === "string" ? schema : JSON.stringify(schema),
  );
}

/**
 * Renders <script type="application/ld+json"> tags for all schemas on a page.
 */
export function PageSchemas({ page }: { page: PageContent | null | undefined }) {
  const schemas = buildPageSchemas(page);
  if (!schemas.length) return null;
  return (
    <>
      {schemas.map((schemaString, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaString }}
        />
      ))}
    </>
  );
}
