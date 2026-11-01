"use client";

import { ArrowDown, ArrowUp, Trash2, Plus } from "lucide-react";
import type { PageFAQ } from "@/lib/page-types";

type FAQEditorProps = {
  /** Current FAQ items for this specific page / post / product. */
  faqs: PageFAQ[];
  /** Called whenever the FAQ list changes (add, edit, remove, reorder). */
  onChange: (faqs: PageFAQ[]) => void;
  /** Optional label shown above the editor. Defaults to "FAQs". */
  label?: string;
};

const inputClass =
  "w-full rounded-md border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none";

/**
 * FAQEditor — reusable dashboard component for managing page-specific FAQs.
 *
 * Features:
 *  - Add new FAQ items
 *  - Edit question and answer inline
 *  - Delete individual FAQ items
 *  - Reorder with ↑ / ↓ buttons
 *
 * Used inside BlogManager, ProductManager, and PageManager.
 */
const FAQEditor = ({
  faqs,
  onChange,
  label = "FAQs",
}: FAQEditorProps) => {
  function addFAQ() {
    onChange([...faqs, { q: "", a: "" }]);
  }

  function removeFAQ(index: number) {
    onChange(faqs.filter((_, i) => i !== index));
  }

  function updateQuestion(index: number, q: string) {
    onChange(faqs.map((faq, i) => (i === index ? { ...faq, q } : faq)));
  }

  function updateAnswer(index: number, a: string) {
    onChange(faqs.map((faq, i) => (i === index ? { ...faq, a } : faq)));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const next = [...faqs];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  }

  function moveDown(index: number) {
    if (index === faqs.length - 1) return;
    const next = [...faqs];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  }

  return (
    <div>
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <label className="block text-sm font-semibold text-foreground">{label}</label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Displayed as an accordion section above the footer. Included in FAQPage JSON-LD schema automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={addFAQ}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
        >
          <Plus size={12} />
          Add FAQ
        </button>
      </div>

      {/* Empty state */}
      {faqs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/50 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No FAQs added yet.{" "}
            <button
              type="button"
              onClick={addFAQ}
              className="font-semibold text-accent hover:underline"
            >
              Add your first FAQ
            </button>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card p-4"
            >
              {/* Item header: number + action buttons */}
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="rounded-md bg-muted px-2 py-0.5 font-display text-xs font-bold text-muted-foreground">
                  FAQ {i + 1}
                </span>

                <div className="flex items-center gap-1">
                  {/* Move up */}
                  <button
                    type="button"
                    onClick={() => moveUp(i)}
                    disabled={i === 0}
                    title="Move up"
                    className="flex h-7 w-7 items-center justify-center rounded border border-border bg-muted text-muted-foreground transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ArrowUp size={13} />
                  </button>

                  {/* Move down */}
                  <button
                    type="button"
                    onClick={() => moveDown(i)}
                    disabled={i === faqs.length - 1}
                    title="Move down"
                    className="flex h-7 w-7 items-center justify-center rounded border border-border bg-muted text-muted-foreground transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ArrowDown size={13} />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => removeFAQ(i)}
                    title="Delete FAQ"
                    className="ml-1 flex h-7 w-7 items-center justify-center rounded border border-border bg-muted text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Q / A inputs */}
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">
                    Question
                  </label>
                  <input
                    type="text"
                    value={faq.q}
                    onChange={(e) => updateQuestion(i, e.target.value)}
                    className={inputClass}
                    placeholder="e.g. What materials can this machine handle?"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">
                    Answer
                  </label>
                  <textarea
                    value={faq.a}
                    onChange={(e) => updateAnswer(i, e.target.value)}
                    rows={3}
                    className={inputClass}
                    placeholder="Provide a clear, helpful answer."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FAQEditor;
