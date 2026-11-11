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
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";
const iconBtn =
  "flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30";

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
          <span className="block text-sm font-medium text-slate-700">
            {label} <span className="text-slate-400">({faqs.length})</span>
          </span>
        </div>
        <button
          type="button"
          onClick={addFAQ}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <Plus size={15} />
          Add FAQ
        </button>
      </div>

      {/* Empty state */}
      {faqs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center">
          <p className="text-sm text-slate-500">
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
              className="rounded-lg border border-slate-200 bg-slate-50/60 p-4"
            >
              {/* Item header: number + action buttons */}
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  FAQ {i + 1}
                </span>

                <div className="flex items-center gap-1">
                  {/* Move up */}
                  <button
                    type="button"
                    onClick={() => moveUp(i)}
                    disabled={i === 0}
                    title="Move up"
                    className={iconBtn}
                  >
                    <ArrowUp size={13} />
                  </button>

                  {/* Move down */}
                  <button
                    type="button"
                    onClick={() => moveDown(i)}
                    disabled={i === faqs.length - 1}
                    title="Move down"
                    className={iconBtn}
                  >
                    <ArrowDown size={13} />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => removeFAQ(i)}
                    title="Delete FAQ"
                    className={`${iconBtn} hover:bg-red-50 hover:text-red-600`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Q / A inputs */}
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
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
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
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
