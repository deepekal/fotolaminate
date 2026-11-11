"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Trash2, Plus } from "lucide-react";
import type { PageFAQ } from "@/lib/page-types";
import { useConfirm } from "@/components/dashboard/confirm";

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
  const confirm = useConfirm();
  // Which items are expanded for editing (by position). Long lists stay compact.
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  const allOpen = faqs.length > 0 && faqs.every((_, i) => open.has(i));

  function toggle(index: number) {
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function addFAQ() {
    onChange([...faqs, { q: "", a: "" }]);
    setOpen((s) => new Set(s).add(faqs.length)); // new item opens for editing
  }

  async function removeFAQ(index: number) {
    const faq = faqs[index];
    // Ask only when there is something to lose.
    if (faq && (faq.q.trim() || faq.a.trim())) {
      const ok = await confirm({
        title: "Remove this FAQ?",
        description: faq.q.trim() ? `“${faq.q.trim()}” will be removed when you save.` : "This question will be removed when you save.",
        confirmLabel: "Remove FAQ",
      });
      if (!ok) return;
    }
    onChange(faqs.filter((_, i) => i !== index));
    setOpen((s) => new Set([...s].filter((i) => i !== index).map((i) => (i > index ? i - 1 : i))));
  }

  function updateQuestion(index: number, q: string) {
    onChange(faqs.map((faq, i) => (i === index ? { ...faq, q } : faq)));
  }

  function updateAnswer(index: number, a: string) {
    onChange(faqs.map((faq, i) => (i === index ? { ...faq, a } : faq)));
  }

  function swap(a: number, b: number) {
    const next = [...faqs];
    [next[a], next[b]] = [next[b], next[a]];
    onChange(next);
    setOpen((s) => new Set([...s].map((i) => (i === a ? b : i === b ? a : i))));
  }

  function moveUp(index: number) {
    if (index > 0) swap(index, index - 1);
  }

  function moveDown(index: number) {
    if (index < faqs.length - 1) swap(index, index + 1);
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="block text-sm font-medium text-slate-700">
          {label} <span className="text-slate-400">({faqs.length})</span>
        </span>
        <div className="flex items-center gap-3">
          {faqs.length > 1 ? (
            <button
              type="button"
              onClick={() => setOpen(allOpen ? new Set() : new Set(faqs.map((_, i) => i)))}
              className="text-sm font-medium text-accent hover:underline"
            >
              {allOpen ? "Collapse all" : "Expand all"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={addFAQ}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Plus size={15} aria-hidden="true" />
            Add FAQ
          </button>
        </div>
      </div>

      {faqs.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 p-6 text-center">
          <p className="text-sm text-slate-500">
            No FAQs added yet.{" "}
            <button type="button" onClick={addFAQ} className="font-semibold text-accent hover:underline">
              Add your first FAQ
            </button>
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-md border border-slate-200">
          {faqs.map((faq, i) => {
            const isOpen = open.has(i);
            return (
              <li key={i} className={isOpen ? "bg-slate-50/70" : "bg-white"}>
                <div className="flex items-center gap-2 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    aria-expanded={isOpen}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <ChevronDown size={16} className={`shrink-0 text-slate-400 transition ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                    <span className="w-7 shrink-0 text-xs font-semibold text-slate-400">{i + 1}.</span>
                    <span className={`truncate text-sm ${faq.q.trim() ? "font-medium text-slate-800" : "italic text-slate-400"}`}>
                      {faq.q.trim() || "New question"}
                    </span>
                    {!faq.a.trim() && faq.q.trim() ? <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">No answer</span> : null}
                  </button>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button type="button" onClick={() => moveUp(i)} disabled={i === 0} title="Move up" aria-label="Move up" className={iconBtn}>
                      <ArrowUp size={13} />
                    </button>
                    <button type="button" onClick={() => moveDown(i)} disabled={i === faqs.length - 1} title="Move down" aria-label="Move down" className={iconBtn}>
                      <ArrowDown size={13} />
                    </button>
                    <button type="button" onClick={() => void removeFAQ(i)} title="Delete FAQ" aria-label="Delete FAQ" className={`${iconBtn} hover:bg-red-50 hover:text-red-600`}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {isOpen ? (
                  <div className="space-y-3 border-t border-slate-200 px-3 pb-3 pt-3 sm:pl-[3.25rem]">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-slate-600">Question</span>
                      <input type="text" value={faq.q} onChange={(e) => updateQuestion(i, e.target.value)} className={inputClass} placeholder="e.g. What materials can this machine handle?" />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-slate-600">Answer</span>
                      <textarea value={faq.a} onChange={(e) => updateAnswer(i, e.target.value)} rows={3} className={inputClass} placeholder="Provide a clear, helpful answer." />
                    </label>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default FAQEditor;
