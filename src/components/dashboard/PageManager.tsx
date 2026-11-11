"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { PageContent, PageField, PageFAQ, PageSection, PageFieldKey } from "@/lib/page-types";
import {
  Card,
  EditorBody,
  EditorHeader,
  EmptyEditor,
  FaqField,
  Field,
  ImageField,
  JsonListEditor,
  ListPane,
  ListRow,
  ManagerLayout,
  SeoPreview,
  btnGhost,
  btnSecondary,
  confirmDiscard,
  inputCls,
  textareaCls,
  useSaveShortcut,
  useUnloadWarning,
} from "@/components/dashboard/admin-ui";
import { Plus, RefreshCw, X } from "lucide-react";

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

  const baseline = useMemo(() => (selectedPage ? toDraft(selectedPage) : null), [selectedPage]);
  const dirty = Boolean(draft && baseline && JSON.stringify(draft) !== JSON.stringify(baseline));
  useUnloadWarning(dirty);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return pages.filter((page) => page.name.toLowerCase().includes(q) || page.pageId.toLowerCase().includes(q) || page.path.toLowerCase().includes(q));
  }, [pages, search]);

  function openPage(id: string) {
    if (id === selectedId) return;
    if (!confirmDiscard(dirty)) return;
    setSelectedId(id);
  }

  function backToList() {
    if (!confirmDiscard(dirty)) return;
    setSelectedId(null);
    setDraft(null);
  }

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
      <button type="button" onClick={() => removeSectionField(sectionId, index)} className={`${btnGhost} h-7 px-2 text-xs`} aria-label={`Remove ${fieldLabel(field)}`}>
        <X size={14} aria-hidden="true" />
      </button>
    );

    if (field.key === "image") {
      return (
        <div className="relative">
          <div className="absolute right-0 top-0">{removeBtn}</div>
          <ImageField label={fieldLabel(field)} value={value} onChange={(v) => updateSectionField(sectionId, index, v)} onUpload={(f) => void uploadImage(sectionId, index, f)} />
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

  const list = (
    <ListPane
      title="Pages"
      count={filtered.length}
      search={search}
      onSearch={setSearch}
      extraAction={
        <button type="button" onClick={() => void refresh()} className={btnSecondary} aria-label="Reload pages">
          <RefreshCw size={15} aria-hidden="true" />
        </button>
      }
      loading={loading}
      emptyText={pages.length === 0 ? "No pages configured." : "No pages match your search."}
    >
      {filtered.map((page) => (
        <ListRow key={page.pageId} active={page.pageId === selectedId} onClick={() => openPage(page.pageId)} title={page.name} meta={page.path} />
      ))}
    </ListPane>
  );

  const editor = !draft ? (
    <EmptyEditor title="Select a page" text="Choose a page from the list to edit its text, images, SEO and FAQs." />
  ) : (
    <div>
      <EditorHeader
        kicker={`Edit page · ${draft.path}`}
        title={draft.name}
        dirty={dirty}
        viewHref={draft.path}
        onSave={() => void save()}
        saving={saving}
        saveLabel="Save page"
        onBack={backToList}
      />
      <EditorBody>
        {draft.sections.map((section) => (
          <Card
            key={section.id}
            title={section.title}
            description={section.type === "faq" ? "Questions and answers" : undefined}
            actions={
              section.type === "faq" ? undefined : (
                <button type="button" onClick={() => addSectionField(section.id, "image")} className={btnSecondary}>
                  <Plus size={15} aria-hidden="true" /> Add image
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
          </Card>
        ))}

        <Card title="Search engine (SEO)" description="How this page appears in Google results.">
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
        </Card>

        <Card title="Page FAQs" description="Page-level questions and answers.">
          <FaqField faqs={draft.faqs} onChange={(faqs) => updateDraft((c) => ({ ...c, faqs }))} label="Questions" />
        </Card>

        <Card title="Advanced" description="Structured data (JSON-LD) for search engines.">
          <JsonListEditor
            items={draft.schemas}
            onChange={(schemas) => updateDraft((c) => ({ ...c, schemas }))}
            addLabel="Add schema"
            emptyText="No structured data added."
            placeholder="Paste JSON or a JSON-LD <script> block"
          />
        </Card>
      </EditorBody>
    </div>
  );

  return <ManagerLayout list={list} editor={editor} showEditorOnMobile={Boolean(draft)} />;
};

export default PageManager;
