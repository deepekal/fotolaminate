"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { PageContent, PageField, PageFAQ, PageSection, PageFieldKey } from "@/lib/page-types";

type DraftSection = Omit<PageSection, 'faqs'> & {
  faqs?: string[];
};

type PageDraft = Omit<PageContent, 'schemas' | 'faqs' | 'sections'> & {
  keywordString: string;
  schemas: string[];
  faqs: string[];
  sections: DraftSection[];
};

function toDraft(page: PageContent): PageDraft {
  const schemas = Array.isArray(page.schemas) 
    ? page.schemas.map((s) => JSON.stringify(s, null, 2)) 
    : [];
  
  const faqs = Array.isArray(page.faqs)
    ? page.faqs.map((faq) => JSON.stringify(faq, null, 2))
    : [];
  
  const sections: DraftSection[] = page.sections.map((section) => {
    const { faqs, ...rest } = section;
    return {
      ...rest,
      ...(faqs ? { faqs: faqs.map((faq) => JSON.stringify(faq, null, 2)) } : {})
    };
  });

  return {
    pageId: page.pageId,
    path: page.path,
    name: page.name,
    seo: page.seo,
    sections,
    keywordString: page.seo.keywords.join(", "),
    schemas,
    faqs,
  };
}

const PageManager = () => {
  const [pages, setPages] = useState<PageContent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PageDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const selectedPage = useMemo(
    () => pages.find((page) => page.pageId === selectedId) ?? null,
    [pages, selectedId],
  );

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (selectedPage) setDraft(toDraft(selectedPage));
  }, [selectedPage]);

  async function refresh() {
    setLoading(true);
    try {
      const list = await api.pages.list();
      setPages(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load pages");
    } finally {
      setLoading(false);
    }
  }

  function updateDraft(updater: (current: PageDraft) => PageDraft) {
    setDraft((current) => (current ? updater(current) : current));
  }

  function updateSectionField(sectionId: string, fieldIndex: number, value: string) {
    updateDraft((current) => {
      const sections = current.sections.map((section) => {
        if (section.id !== sectionId) return section;
        if (!section.fields) return section;
        const nextFields = section.fields.map((field, index) =>
          index === fieldIndex ? { ...field, value } : field,
        );
        return { ...section, fields: nextFields };
      });
      return { ...current, sections };
    });
  }

  function updateSectionFAQ(sectionId: string, faqIndex: number, value: string) {
    updateDraft((current) => {
      const sections = current.sections.map((section) => {
        if (section.id !== sectionId) return section;
        if (!section.faqs) return section;
        const nextFaqs = section.faqs.map((faq, index) =>
          index === faqIndex ? value : faq,
        );
        return { ...section, faqs: nextFaqs };
      });
      return { ...current, sections };
    });
  }

  function addSectionFAQ(sectionId: string) {
    updateDraft((current) => {
      const sections = current.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const nextFaqs = [...(section.faqs ?? []), JSON.stringify({ q: "", a: "" }, null, 2)];
        return { ...section, faqs: nextFaqs };
      });
      return { ...current, sections };
    });
  }

  function removeSectionFAQ(sectionId: string, faqIndex: number) {
    updateDraft((current) => {
      const sections = current.sections.map((section) => {
        if (section.id !== sectionId) return section;
        if (!section.faqs) return section;
        const nextFaqs = section.faqs.filter((_, idx) => idx !== faqIndex);
        return { ...section, faqs: nextFaqs };
      });
      return { ...current, sections };
    });
  }


  async function uploadImage(sectionId: string, fieldIndex: number, file: File) {
    if (!file) return;
    try {
      const { url } = await api.uploads.imgbb(file);
      updateSectionField(sectionId, fieldIndex, url);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to upload image");
    }
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    try {
      const keywords = draft.keywordString
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      // Parse schemas strings into JSON objects when possible
      const schemasParsed = Array.isArray(draft.schemas)
        ? draft.schemas
            .map((s) => (typeof s === "string" ? s.trim() : ""))
            .filter(Boolean)
            .map((s) => {
              try {
                const t = s.trim();
                if (t.startsWith("<script")) {
                  const start = t.indexOf(">") + 1;
                  const end = t.lastIndexOf("</script>");
                  if (start <= 0 || end <= start) throw new Error("Invalid <script> block");
                  return JSON.parse(t.slice(start, end).trim());
                }
                return JSON.parse(t);
              } catch {
                return null;
              }
            })
            .filter((v): v is unknown => v !== null)
        : [];

      // Parse FAQs from JSON strings
      const faqsParsed = Array.isArray(draft.faqs)
        ? draft.faqs
            .map((f) => (typeof f === "string" ? f.trim() : ""))
            .filter(Boolean)
            .map((f) => {
              try {
                return JSON.parse(f) as PageFAQ;
              } catch {
                return null;
              }
            })
            .filter((v): v is PageFAQ => v !== null && typeof v.q === "string" && typeof v.a === "string")
        : [];

      // Parse sections (both standard and FAQ sections)
     const sectionsParsed: PageSection[] = draft.sections.map((section) => {
        const sectionType = section.type ?? "standard";
        
        if (sectionType === "faq") {
          // FAQ section
          const sectionFaqsParsed = Array.isArray(section.faqs)
            ? section.faqs
                .map((f) => (typeof f === "string" ? f.trim() : ""))
                .filter(Boolean)
                .map((f) => {
                  try {
                    return JSON.parse(f) as PageFAQ;
                  } catch {
                    return null;
                  }
                })
                .filter((v): v is PageFAQ => v !== null && typeof v.q === "string" && typeof v.a === "string")
            : [];
          
          return {
            id: section.id,
            title: section.title,
            type: "faq",
            faqs: sectionFaqsParsed,
          };
        }

        // Standard section (default)
        return {
          id: section.id,
          title: section.title,
          type: "standard",
          fields: section.fields ?? [],
        };
      });

      const payload = {
        ...draft,
        seo: {
          ...draft.seo,
          keywords,
        },
        schemas: schemasParsed,
        faqs: faqsParsed,
        sections: sectionsParsed,
      };

      await api.pages.update(draft.pageId, payload);
      toast.success("Page updated");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save page");
    } finally {
      setSaving(false);
    }
  }

  function addSectionField(sectionId: string, key: PageFieldKey) {
    updateDraft((current) => {
      const sections = current.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const fields = section.fields ? [...section.fields] : [];
        fields.push({ key, label: "Image", value: "" });
        return { ...section, fields };
      });
      return { ...current, sections };
    });
  }

  function removeSectionField(sectionId: string, fieldIndex: number) {
    updateDraft((current) => {
      const sections = current.sections.map((section) => {
        if (section.id !== sectionId) return section;
        if (!section.fields) return section;
        const fields = section.fields.filter((_, idx) => idx !== fieldIndex);
        return { ...section, fields };
      });
      return { ...current, sections };
    });
  }

  function parseFaqJson(faqString: string): PageFAQ {
    try {
      return JSON.parse(faqString);
    } catch {
      return { q: "", a: "" };
    }
  }

  function faqToJson(faq: PageFAQ): string {
    return JSON.stringify(faq, null, 2);
  }

  function updateSectionFAQQuestion(sectionId: string, faqIndex: number, question: string) {
    updateDraft((current) => {
      const sections = current.sections.map((section) => {
        if (section.id !== sectionId) return section;
        if (!section.faqs) return section;
        const nextFaqs = section.faqs.map((faq, index) => {
          if (index !== faqIndex) return faq;
          const parsed = parseFaqJson(faq);
          return faqToJson({ ...parsed, q: question });
        });
        return { ...section, faqs: nextFaqs };
      });
      return { ...current, sections };
    });
  }

  function updateSectionFAQAnswer(sectionId: string, faqIndex: number, answer: string) {
    updateDraft((current) => {
      const sections = current.sections.map((section) => {
        if (section.id !== sectionId) return section;
        if (!section.faqs) return section;
        const nextFaqs = section.faqs.map((faq, index) => {
          if (index !== faqIndex) return faq;
          const parsed = parseFaqJson(faq);
          return faqToJson({ ...parsed, a: answer });
        });
        return { ...section, faqs: nextFaqs };
      });
      return { ...current, sections };
    });
  }

  function updateGlobalFAQQuestion(faqIndex: number, question: string) {
    updateDraft((current) => {
      const nextFaqs = current.faqs.map((faq, index) => {
        if (index !== faqIndex) return faq;
        const parsed = parseFaqJson(faq);
        return faqToJson({ ...parsed, q: question });
      });
      return { ...current, faqs: nextFaqs };
    });
  }

  function updateGlobalFAQAnswer(faqIndex: number, answer: string) {
    updateDraft((current) => {
      const nextFaqs = current.faqs.map((faq, index) => {
        if (index !== faqIndex) return faq;
        const parsed = parseFaqJson(faq);
        return faqToJson({ ...parsed, a: answer });
      });
      return { ...current, faqs: nextFaqs };
    });
  }

  function renderFieldInput(sectionId: string, field: PageField, index: number) {
    const value = field.value ?? "";
    const label = `${field.label} (${field.key})`;
    const inputClass =
      "w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none";

    if (field.key === "image") {
      return (
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">{label}</label>
            <button type="button" onClick={() => removeSectionField(sectionId, index)} className="text-xs font-semibold text-destructive hover:underline">Remove</button>
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              type="text"
              value={value}
              onChange={(e) => updateSectionField(sectionId, index, e.target.value)}
              className={inputClass}
              placeholder="Image URL"
            />
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-accent">
              Upload
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadImage(sectionId, index, file);
                }}
              />
            </label>
          </div>
          {value ? <img src={value} alt={field.label} className="h-28 w-full rounded-lg object-cover" /> : null}
        </div>
      );
    }

    if (field.key === "p" || value.length > 120) {
      return (
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">{label}</label>
            <button type="button" onClick={() => removeSectionField(sectionId, index)} className="text-xs font-semibold text-destructive hover:underline">Remove</button>
          </div>
          <textarea
            rows={4}
            value={value}
            onChange={(e) => updateSectionField(sectionId, index, e.target.value)}
            className={inputClass}
            placeholder="Enter paragraph text"
          />
        </div>
      );
    }

    return (
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground">{label}</label>
          <button type="button" onClick={() => removeSectionField(sectionId, index)} className="text-xs font-semibold text-destructive hover:underline">Remove</button>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => updateSectionField(sectionId, index, e.target.value)}
          className={inputClass}
          placeholder="Enter text"
        />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-foreground">Pages</h2>
          <button
            type="button"
            onClick={refresh}
            className="rounded-md border border-border bg-muted px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-accent"
          >
            Refresh
          </button>
        </div>

        <input
          type="search"
          placeholder="Search pages…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
        />

        <div className="space-y-3">
          {loading ? (
            <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">Loading…</div>
          ) : pages.length === 0 ? (
            <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">No pages configured.</div>
          ) : (
            pages
              .filter((page) =>
                page.name.toLowerCase().includes(search.toLowerCase()) ||
                page.pageId.toLowerCase().includes(search.toLowerCase()) ||
                page.path.toLowerCase().includes(search.toLowerCase()),
              )
              .map((page) => (
                <button
                  key={page.pageId}
                  type="button"
                  onClick={() => setSelectedId(page.pageId)}
                  className={`w-full rounded-lg border p-4 text-left shadow-industrial transition-colors ${
                    page.pageId === selectedId ? "border-accent bg-card" : "border-border bg-muted hover:border-accent/50"
                  }`}
                >
                  <div className="mb-1 font-display text-base font-bold text-foreground">{page.name}</div>
                  <div className="text-xs text-muted-foreground">{page.path}</div>
                </button>
              ))
          )}
        </div>
      </div>

      <div className="lg:col-span-8">
        <div className="mb-4 rounded-lg border border-border bg-muted p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-display text-lg font-bold text-foreground">Page editor</div>
              <div className="text-xs text-muted-foreground">Edit section text, page SEO, and section-level image fields.</div>
            </div>
            <button
              type="button"
              onClick={save}
              disabled={!draft || saving}
              className="rounded-md gradient-accent px-4 py-2 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save page"}
            </button>
          </div>
        </div>

        {!draft ? (
          <div className="rounded-lg border border-border bg-muted p-6 text-sm text-muted-foreground">
            Select a page from the list to edit its sections and SEO fields.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">SEO title</label>
                  <input
                    type="text"
                    value={draft.seo.title}
                    onChange={(e) => updateDraft((current) => ({ ...current, seo: { ...current.seo, title: e.target.value } }))}
                    className="w-full rounded-md border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">SEO keywords</label>
                  <input
                    type="text"
                    value={draft.keywordString}
                    onChange={(e) => updateDraft((current) => ({ ...current, keywordString: e.target.value }))}
                    className="w-full rounded-md border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                    placeholder="photo lamination, machines, industrial"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-foreground">SEO description</label>
                <textarea
                  rows={3}
                  value={draft.seo.description}
                  onChange={(e) => updateDraft((current) => ({ ...current, seo: { ...current.seo, description: e.target.value } }))}
                  className="w-full rounded-md border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                />
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-semibold text-foreground">Structured Data Schemas (JSON-LD)</label>
                  <button
                    type="button"
                    onClick={() => updateDraft((c) => ({ ...c, schemas: [...c.schemas, "{"] }))}
                    className="rounded-md border border-border bg-muted px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-accent"
                  >
                    + Add Schema
                  </button>
                </div>

                {draft.schemas.length === 0 ? (
                  <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
                    No schemas added yet. Click the + Add Schema button to add structured data.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {draft.schemas.map((schema, i) => (
                      <div key={i} className="rounded-lg border border-border bg-card p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="text-xs font-semibold text-muted-foreground">Schema {i + 1}</div>
                          <button
                            type="button"
                            onClick={() => updateDraft((c) => ({ ...c, schemas: c.schemas.filter((_, idx) => idx !== i) }))}
                            className="text-xs font-semibold text-destructive hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                        <textarea
                          value={schema}
                          onChange={(e) => updateDraft((c) => ({ ...c, schemas: c.schemas.map((s, idx) => (idx === i ? e.target.value : s)) }))}
                          rows={6}
                          className="w-full rounded-md border border-border bg-muted px-4 py-3 font-mono text-xs text-foreground focus:border-accent focus:outline-none"
                          placeholder="Paste JSON or a JSON-LD <script> block"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-2 text-xs text-muted-foreground">
                  Add multiple JSON-LD schemas (FAQPage, Organization, etc.). Paste valid JSON or a single JSON-LD script block. Each entry renders as a separate script tag.
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-semibold text-foreground">FAQs</label>
                  <button
                    type="button"
                    onClick={() => updateDraft((c) => ({ ...c, faqs: [...c.faqs, JSON.stringify({ q: "", a: "" }, null, 2)] }))}
                    className="rounded-md border border-border bg-muted px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-accent"
                  >
                    + Add FAQ
                  </button>
                </div>

                {draft.faqs.length === 0 ? (
                  <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
                    No FAQs added yet. Click the + Add FAQ button to add a frequently asked question.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {draft.faqs.map((faq, i) => {
                      const parsed = parseFaqJson(faq);
                      return (
                        <div key={i} className="rounded-lg border border-border bg-card p-4">
                          <div className="mb-4 flex items-center justify-between">
                            <div className="text-xs font-semibold text-muted-foreground">FAQ {i + 1}</div>
                            <button
                              type="button"
                              onClick={() => updateDraft((c) => ({ ...c, faqs: c.faqs.filter((_, idx) => idx !== i) }))}
                              className="text-xs font-semibold text-destructive hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="mb-2 block text-sm font-semibold text-foreground">Question</label>
                              <input
                                type="text"
                                value={parsed.q}
                                onChange={(e) => updateGlobalFAQQuestion(i, e.target.value)}
                                className="w-full rounded-md border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                                placeholder="Enter question"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-sm font-semibold text-foreground">Answer</label>
                              <textarea
                                value={parsed.a}
                                onChange={(e) => updateGlobalFAQAnswer(i, e.target.value)}
                                rows={3}
                                className="w-full rounded-md border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                                placeholder="Enter answer"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-2 text-xs text-muted-foreground">
                  Add FAQs for the page level. Questions and answers will be displayed in an accordion on the page.
                </div>
              </div>
            </div>

            {draft.sections.map((section) => (
              <div key={section.id} className="rounded-lg border border-border bg-card p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="font-display text-base font-semibold text-foreground">{section.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Section id: {section.id} {section.type === "faq" && "• FAQ Section"}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {section.type === "faq" ? (
                    <>
                      <div className="mb-3 flex items-center justify-between">
                        <label className="text-sm font-semibold text-foreground">FAQs</label>
                        <button
                          type="button"
                          onClick={() => addSectionFAQ(section.id)}
                          className="rounded-md border border-border bg-muted px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-accent"
                        >
                          + Add FAQ
                        </button>
                      </div>
                      {!section.faqs || section.faqs.length === 0 ? (
                        <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
                          No FAQs added yet.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {section.faqs.map((faq, i) => {
                            const parsed = parseFaqJson(faq);
                            return (
                              <div key={i} className="rounded-lg border border-border bg-muted p-4">
                                <div className="mb-4 flex items-center justify-between">
                                  <div className="text-xs font-semibold text-muted-foreground">FAQ {i + 1}</div>
                                  <button
                                    type="button"
                                    onClick={() => removeSectionFAQ(section.id, i)}
                                    className="text-xs font-semibold text-destructive hover:underline"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <label className="mb-2 block text-sm font-semibold text-foreground">Question</label>
                                    <input
                                      type="text"
                                      value={parsed.q}
                                      onChange={(e) => updateSectionFAQQuestion(section.id, i, e.target.value)}
                                      className="w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                                      placeholder="Enter question"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-2 block text-sm font-semibold text-foreground">Answer</label>
                                    <textarea
                                      value={parsed.a}
                                      onChange={(e) => updateSectionFAQAnswer(section.id, i, e.target.value)}
                                      rows={3}
                                      className="w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                                      placeholder="Enter answer"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {section.fields?.map((field, index) => (
                        <div key={`${section.id}-${index}`}>{renderFieldInput(section.id, field, index)}</div>
                      ))}
                      <div className="mt-4 flex">
                        <button
                          type="button"
                          onClick={() => addSectionField(section.id, "image")}
                          className="rounded-md border border-border bg-muted px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-accent"
                        >
                          + Add Image
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageManager;
