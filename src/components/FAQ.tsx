/**
 * FAQ — legacy accordion component.
 *
 * Kept for backwards-compatibility with screens that haven't migrated to FAQSection yet.
 * This version does NOT fall back to any default FAQs — it renders nothing when faqs is
 * empty or null. Use FAQSection for new integrations (it also injects FAQPage JSON-LD).
 */
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { PageFAQ } from "@/lib/page-types";

type FAQProps = {
  faqs?: PageFAQ[] | null;
};

const FAQ = ({ faqs = null }: FAQProps) => {
  // Render nothing when no page-specific FAQs are provided.
  if (!faqs || faqs.length === 0) return null;

  return (
    <section className="section-padding bg-card">
      <div className="container-max max-w-3xl">
        <div className="mb-12 text-center">
          <span className="mb-2 inline-block font-display text-sm font-bold uppercase tracking-widest text-accent">
            FAQ
          </span>
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Frequently Asked Questions
          </h2>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="rounded-lg border border-border bg-muted px-5">
              <AccordionTrigger className="font-display text-base font-semibold text-foreground hover:text-accent hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
