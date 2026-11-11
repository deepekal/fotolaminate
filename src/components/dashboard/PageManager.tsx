"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { PageContent, PageField, PageFAQ, PageSection, PageFieldKey } from "@/lib/page-types";
import {
  AdminTable,
  Breadcrumb,
  EditorLayout,
  FaqField,
  Field,
  ImageBox,
  JsonListEditor,
  PageTitle,
  Panel,
  PublishBox,
  SeoPreview,
  TitleCell,
  btnGhost,
  btnSecondary,
  inputCls,
  textareaCls,
  useSaveShortcut,
  useUnloadWarning,
} from "@/components/dashboard/admin-ui";
import { Loader2, Plus, RefreshCw, X } from "lucide-react";
import { useConfirm } from "@/components/dashboard/confirm";

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

type SectionProps = {
  routeId?: string;
  navigate: (hash: string) => void;
  onDirtyChange: (dirty: boolean) => void;
};

const PageManager = ({ routeId, navigate, onDirtyChange }: SectionProps) => {
  const confirm = useConfirm();
  const [pages, setPages] = useState<PageContent[]>([]);
  const selectedId = routeId ?? null;
  const [draft, setDraft] = useState<PageDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const selectedPage = useMemo(
    () => pages.find((page) => page.pageId === selectedId) ?? null,
    [pages, selectedId],
  );

  const baseline = useMemo(() => (selectedPage ? toDraft(selectedPage) : null), [selectedPage]);
  const dirty = Boolean(draft && baseline && JSON.stringify(draft) !== JSON.stringify(baseline));
  useUnloadWarning(dirty);
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    return pages
      .filter((page) => page.name.toLowerCase().includes(q) || page.pageId.toLowerCase().includes(q) || page.path.toLowerCase().includes(q))
      .map((page) => ({ ...page, id: page.pageId }));
  }, [pages, search]);

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    setDraft(selectedPage ? toDraft(selectedPage) : null);
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

  useSaveShortcut(() => void save(), Boolean(draft));

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







  function fieldLabel(field: PageField) {
    const kinds: Record<string, string> = { h1: "Main heading", h2: "Heading", h3: "Subheading", p: "Paragraph", image: "Image", link: "Link" };
    return field.label || kinds[field.key] || field.key;
  }

  function renderFieldInput(sectionId: string, field: PageField, index: number) {
    const value = field.value ?? "";
    const removeBtn = (
      <button
        type="button"
        onClick={async () => {
          if (value.trim()) {
            const ok = await confirm({
              title: `Remove “${fieldLabel(field)}”?`,
              description: "This content will be removed from the page when you save.",
              confirmLabel: "Remove",
            });
            if (!ok) return;
          }
          removeSectionField(sectionId, index);
        }}
        className={`${btnGhost} h-7 px-2 text-xs`} aria-label={`Remove ${fieldLabel(field)}`}>
        <X size={14} aria-hidden="true" />
      </button>
    );

    if (field.key === "image") {
      return (
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-700">{fieldLabel(field)}</span>
            {removeBtn}
          </div>
          <div className="max-w-sm">
            <ImageBox value={value} onChange={(v) => updateSectionField(sectionId, index, v)} />
          </div>
        </div>
      );
    }

    const long = field.key === "p" || value.length > 120;
    return (
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-slate-700">
            {fieldLabel(field)} <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">{field.key}</span>
          </span>
          {removeBtn}
        </div>
        {long ? (
          <textarea rows={4} value={value} onChange={(e) => updateSectionField(sectionId, index, e.target.value)} className={textareaCls} placeholder="Enter text" aria-label={fieldLabel(field)} />
        ) : (
          <input type="text" value={value} onChange={(e) => updateSectionField(sectionId, index, e.target.value)} className={inputCls} placeholder="Enter text" aria-label={fieldLabel(field)} />
        )}
      </div>
    );
  }

  /* ---------------------------------------------------------------- table */
  if (!routeId) {
    return (
      <>
        <PageTitle
          title="Pages"
          actions={
            <button type="button" onClick={() => void refresh()} className={btnSecondary}>
              <RefreshCw size={15} aria-hidden="true" /> Reload
            </button>
          }
        >
          <p className="text-sm text-slate-500">Text, images, SEO and FAQs for each page of the website.</p>
        </PageTitle>
        <AdminTable
          rows={rows}
          loading={loading}
          columns={[{ label: "Page" }, { label: "Address", className: "w-56" }, { label: "Sections", className: "w-28" }, { label: "FAQs", className: "w-24" }]}
          emptyText={pages.length === 0 ? "No pages configured." : "No pages match your search."}
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search pages"
          renderRow={(page) => (
            <>
              <TitleCell title={page.name} onEdit={() => navigate(`/pages/${page.pageId}`)} viewHref={page.path} />
              <td className="py-2.5 pr-4 font-mono text-xs text-slate-500">{page.path}</td>
              <td className="py-2.5 pr-4 text-slate-600">{page.sections.length}</td>
              <td className="py-2.5 pr-4 text-slate-600">{(page.faqs?.length ?? 0) + page.sections.reduce((n, sec) => n + (sec.faqs?.length ?? 0), 0)}</td>
            </>
          )}
        />
      </>
    );
  }

  /* --------------------------------------------------------------- editor */
  if (!draft) {
    return (
      <div className="p-10 text-center text-sm text-slate-500">
        {loading ? (
          <>
            <Loader2 size={18} className="mr-2 inline animate-spin" aria-hidden="true" /> Loading…
          </>
        ) : (
          <>
            This page doesn't exist.{" "}
            <button type="button" onClick={() => navigate("/pages")} className="font-semibold text-accent hover:underline">
              Back to pages
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <Breadcrumb backLabel="Pages" onBack={() => navigate("/pages")} current={draft.name} dirty={dirty} />
      <EditorLayout
        main={
          <>
            {draft.sections.map((section) => (
              <Panel
                key={section.id}
                id={`section-${section.id}`}
                title={section.title}
                actions={
                  section.type === "faq" ? undefined : (
                    <button type="button" onClick={() => addSectionField(section.id, "image")} className="text-xs font-semibold text-accent hover:underline">
                      + Add image
                    </button>
                  )
                }
              >
                {section.type === "faq" ? (
                  <FaqField
                    faqs={section.faqs ?? []}
                    onChange={(faqs) =>
                      updateDraft((current) => ({
                        ...current,
                        sections: current.sections.map((sec) => (sec.id === section.id ? { ...sec, faqs } : sec)),
                      }))
                    }
                    label="Questions"
                  />
                ) : section.fields && section.fields.length > 0 ? (
                  section.fields.map((field, index) => <div key={`${section.id}-${index}`}>{renderFieldInput(section.id, field, index)}</div>)
                ) : (
                  <p className="text-sm text-slate-500">This section has no editable fields.</p>
                )}
              </Panel>
            ))}

            <Panel title="SEO" id="section-seo">
              <SeoPreview title={draft.seo.title} description={draft.seo.description} path={draft.path} />
              <Field label="SEO title" counter={{ value: draft.seo.title.trim().length, ideal: [50, 60] }}>
                <input type="text" value={draft.seo.title} onChange={(e) => updateDraft((current) => ({ ...current, seo: { ...current.seo, title: e.target.value } }))} className={inputCls} />
              </Field>
              <Field label="SEO description" counter={{ value: draft.seo.description.trim().length, ideal: [140, 160] }}>
                <textarea rows={3} value={draft.seo.description} onChange={(e) => updateDraft((current) => ({ ...current, seo: { ...current.seo, description: e.target.value } }))} className={textareaCls} />
              </Field>
              <Field label="Keywords" hint="Separate with commas.">
                <input type="text" value={draft.keywordString} onChange={(e) => updateDraft((current) => ({ ...current, keywordString: e.target.value }))} className={inputCls} />
              </Field>
            </Panel>

            <Panel title="Page FAQs" id="section-faqs">
              <FaqField faqs={draft.faqs} onChange={(faqs) => updateDraft((c) => ({ ...c, faqs }))} label="Page-level questions" />
            </Panel>

            <Panel title="Structured data (advanced)">
              <JsonListEditor
                items={draft.schemas}
                onChange={(schemas) => updateDraft((c) => ({ ...c, schemas }))}
                addLabel="Add schema"
                emptyText="No structured data added."
                placeholder="Paste JSON or a JSON-LD <script> block"
              />
            </Panel>
          </>
        }
        sidebar={
          <>
            <PublishBox isNew={false} viewHref={draft.path} onSave={() => void save()} saving={saving} saveLabel="Update page" />
            <section className="rounded-md border border-slate-200 bg-white p-4 text-sm shadow-sm">
              <p className="font-semibold text-slate-900">On this page</p>
              <ul className="mt-2 space-y-0.5">
                {[...draft.sections.map((sec) => ({ id: sec.id, title: sec.title })), { id: "seo", title: "SEO" }, { id: "faqs", title: `Page FAQs (${draft.faqs.length})` }].map((sec) => (
                  <li key={sec.id}>
                    <button
                      type="button"
                      onClick={() => document.getElementById(`section-${sec.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                      className="block w-full truncate rounded px-2 py-1 text-left text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    >
                      {sec.title}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </>
        }
      />
    </>
  );
};

export default PageManager;
