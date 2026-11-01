"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { PageFAQ } from "@/lib/page-types";

type FAQSectionProps = {
  /** FAQs belonging to this specific page. Component renders nothing when empty or null. */
  faqs?: PageFAQ[] | Array<{ q: string; a: string }> | null;
  /** Section heading — defaults to "Frequently Asked Questions" */
  heading?: string;
};

/**
 * FAQSection — reusable page-body FAQ accordion section.
 *
 * - Renders ONLY when faqs has items (never shows generic defaults).
 * - Auto-injects FAQPage JSON-LD schema for SEO.
 * - Intended to be placed above the footer in every page type.
 */
const FAQSection = ({
  faqs,
  heading = "Frequently Asked Questions",
}: FAQSectionProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!faqs || faqs.length === 0) return null;

  const faqSchemaJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  });

  return (
    <>
      {/* FAQPage JSON-LD — auto-generated from page FAQ data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: faqSchemaJson }}
      />

      <section className="section-padding bg-card">
        <div className="container-max max-w-3xl">
          {/* Section header */}
          <div className="mb-12 text-center">
            <span className="mb-2 inline-block font-display text-sm font-bold uppercase tracking-widest text-accent">
              FAQ
            </span>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              {heading}
            </h2>
          </div>

          {/* Accordion items */}
          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = openIndex === i;
              return (
                <div
                  key={i}
                  className="overflow-hidden rounded-lg border border-border bg-muted transition-colors"
                >
                  <button
                    type="button"
                    id={`faq-trigger-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-content-${i}`}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                  >
                    <span className="font-display text-base font-semibold text-foreground transition-colors group-hover:text-accent">
                      {faq.q}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-muted-foreground transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-accent" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div
                      id={`faq-content-${i}`}
                      role="region"
                      aria-labelledby={`faq-trigger-${i}`}
                      className="border-t border-border px-5 pb-5 pt-4 text-sm leading-relaxed text-muted-foreground"
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};

export default FAQSection;
