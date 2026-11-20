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
  MetaBox,
  PageTitle,
  Panel,
  PublishBox,
  SeoPreview,
  TitleCell,
  btnGhost,
  btnSecondary,
  formatDate,
  inputCls,
  textareaCls,
  useSaveShortcut,
  useUnloadWarning,
} from "@/components/dashboard/admin-ui";
import { ChevronLeft, ChevronRight, HelpCircle, Image as ImageIcon, Loader2, RefreshCw, Search, Settings2, Type, X } from "lucide-react";
import { useConfirm } from "@/components/dashboard/confirm";

type DraftSection = Omit<PageSection, 'faqs'> & {
  faqs?: string[];
};

type PageDraft = Omit<PageContent, 'schemas' | 'faqs' | 'sections' | 'updatedAt'> & {
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

function firstImage(page: PageContent): string | null {
  for (const sec of page.sections) for (const f of sec.fields ?? []) if (f.key === "image" && f.value) return f.value;
  return null;
}

function seoBadge(page: PageContent) {
  const t = page.seo.title.trim().length;
  const d = page.seo.description.trim().length;
  const ok = t >= 30 && t <= 65 && d >= 100 && d <= 170;
  const missing = t === 0 || d === 0;
  const cls = missing ? "bg-red-50 text-red-700" : ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{missing ? "Missing" : ok ? "Good" : "Check"}</span>;
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
  const [tab, setTab] = useState<"content" | "seo" | "faqs" | "advanced">("content");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

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
          <span className="text-sm font-medium text-slate-700">{fieldLabel(field)}</span>
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
          columns={[{ label: "Page" }, { label: "Address", className: "w-52" }, { label: "Sections", className: "w-24" }, { label: "FAQs", className: "w-20" }, { label: "SEO", className: "w-28" }, { label: "Updated", className: "w-32" }]}
          emptyText={pages.length === 0 ? "No pages configured." : "No pages match your search."}
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search pages"
          renderRow={(page) => (
            <>
              <TitleCell thumb={firstImage(page)} title={page.name} onEdit={() => navigate(`/pages/${page.pageId}`)} viewHref={page.path} />
              <td className="py-2.5 pr-4 font-mono text-xs text-slate-500">{page.path}</td>
              <td className="py-2.5 pr-4 text-slate-600">{page.sections.length}</td>
              <td className="py-2.5 pr-4 text-slate-600">{(page.faqs?.length ?? 0) + page.sections.reduce((n, sec) => n + (sec.faqs?.length ?? 0), 0)}</td>
              <td className="py-2.5 pr-4">{seoBadge(page)}</td>
              <td className="py-2.5 pr-4 text-slate-500">{page.updatedAt ? formatDate(page.updatedAt) : <span className="text-slate-400">—</span>}</td>
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

  const sections = draft.sections;
  const activeSection = sections.find((sec) => sec.id === activeSectionId) ?? sections[0] ?? null;
  const activeIndex = activeSection ? sections.findIndex((sec) => sec.id === activeSection.id) : -1;
  const sectionChanged = (id: string) => {
    const a = draft.sections.find((sec) => sec.id === id);
    const b = baseline?.sections.find((sec) => sec.id === id);
    return JSON.stringify(a) !== JSON.stringify(b);
  };
  const sectionSummary = (sec: DraftSection) => {
    if (sec.type === "faq") return `${sec.faqs?.length ?? 0} question${(sec.faqs?.length ?? 0) === 1 ? "" : "s"}`;
    const n = sec.fields?.length ?? 0;
    const imgs = sec.fields?.filter((f) => f.key === "image").length ?? 0;
    return `${n} field${n === 1 ? "" : "s"}${imgs ? ` · ${imgs} image${imgs === 1 ? "" : "s"}` : ""}`;
  };
  const sectionHeadline = (sec: DraftSection) => sec.fields?.find((f) => (f.key === "h1" || f.key === "h2") && f.value.trim())?.value ?? "";
  const totalFaqs = draft.faqs.length + sections.reduce((n, sec) => n + (sec.faqs?.length ?? 0), 0);
  const tabs: { id: typeof tab; label: string; icon: typeof Type; count?: number }[] = [
    { id: "content", label: "Content", icon: Type, count: sections.length },
    { id: "seo", label: "SEO", icon: Search },
    { id: "faqs", label: "FAQs", icon: HelpCircle, count: draft.faqs.length },
    { id: "advanced", label: "Advanced", icon: Settings2 },
  ];
  const go = (index: number) => {
    const sec = sections[index];
    if (sec) {
      setActiveSectionId(sec.id);
      setTab("content");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      <Breadcrumb backLabel="Pages" onBack={() => navigate("/pages")} current={draft.name} dirty={dirty} />
      <EditorLayout
        main={
          <>
            <div className="rounded-md border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <h2 className="font-display text-2xl font-bold text-slate-900">{draft.name}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    www.fotolaminate.com<span className="text-slate-700">{draft.path}</span> · {sections.length} section{sections.length === 1 ? "" : "s"} · {totalFaqs} FAQ{totalFaqs === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <nav className="flex gap-1 overflow-x-auto border-t border-slate-200 px-3" aria-label="Page editor tabs">
                {tabs.map(({ id, label, icon: Icon, count }) => {
                  const active = tab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTab(id)}
                      className={`-mb-px inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium ${active ? "border-accent text-accent" : "border-transparent text-slate-600 hover:text-slate-900"}`}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon size={15} aria-hidden="true" /> {label}
                      {count !== undefined ? <span className={`rounded-full px-1.5 text-[11px] ${active ? "bg-accent/10 text-accent" : "bg-slate-100 text-slate-500"}`}>{count}</span> : null}
                    </button>
                  );
                })}
              </nav>
            </div>

            {tab === "content" ? (
              activeSection ? (
                <Panel
                  key={activeSection.id}
                  id={`section-${activeSection.id}`}
                  title={`${activeIndex + 1}. ${activeSection.title}`}
                  actions={
                    activeSection.type === "faq" ? undefined : (
                      <button type="button" onClick={() => addSectionField(activeSection.id, "image")} className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">
                        <ImageIcon size={14} aria-hidden="true" /> Add image
                      </button>
                    )
                  }
                >
                  {activeSection.type === "faq" ? (
                    <FaqField
                      faqs={activeSection.faqs ?? []}
                      onChange={(faqs) =>
                        updateDraft((current) => ({
                          ...current,
                          sections: current.sections.map((sec) => (sec.id === activeSection.id ? { ...sec, faqs } : sec)),
                        }))
                      }
                      label="Questions"
                    />
                  ) : activeSection.fields && activeSection.fields.length > 0 ? (
                    <>
                      {activeSection.fields.filter((f) => f.key !== "image").map((field) => {
                        const index = activeSection.fields!.indexOf(field);
                        return <div key={`${activeSection.id}-${index}`}>{renderFieldInput(activeSection.id, field, index)}</div>;
                      })}
                      {activeSection.fields.some((f) => f.key === "image") ? (
                        <div className="grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                          {activeSection.fields.filter((f) => f.key === "image").map((field) => {
                            const index = activeSection.fields!.indexOf(field);
                            return <div key={`${activeSection.id}-${index}`}>{renderFieldInput(activeSection.id, field, index)}</div>;
                          })}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">This section has no editable fields.</p>
                  )}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <button type="button" disabled={activeIndex <= 0} onClick={() => go(activeIndex - 1)} className={`${btnSecondary} disabled:opacity-40`}>
                      <ChevronLeft size={15} aria-hidden="true" /> {sections[activeIndex - 1]?.title ?? "Previous"}
                    </button>
                    <span className="text-xs text-slate-400">
                      {activeIndex + 1} / {sections.length}
                    </span>
                    <button type="button" disabled={activeIndex >= sections.length - 1} onClick={() => go(activeIndex + 1)} className={`${btnSecondary} disabled:opacity-40`}>
                      {sections[activeIndex + 1]?.title ?? "Next"} <ChevronRight size={15} aria-hidden="true" />
                    </button>
                  </div>
                </Panel>
              ) : (
                <Panel title="Content">
                  <p className="text-sm text-slate-500">This page has no editable sections.</p>
                </Panel>
              )
            ) : null}

            {tab === "seo" ? (
              <Panel title="Search engine listing" id="section-seo">
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
            ) : null}

            {tab === "faqs" ? (
              <Panel title="Page FAQs" id="section-faqs">
                <p className="-mt-1 text-xs text-slate-500">Shown at the bottom of the page and sent to Google as FAQ structured data.</p>
                <FaqField faqs={draft.faqs} onChange={(faqs) => updateDraft((c) => ({ ...c, faqs }))} label="Page-level questions" />
              </Panel>
            ) : null}

            {tab === "advanced" ? (
              <Panel title="Structured data (advanced)">
                <p className="-mt-1 text-xs text-slate-500">JSON-LD blocks added to the page head. Leave alone unless you know what you are doing.</p>
                <JsonListEditor
                  items={draft.schemas}
                  onChange={(schemas) => updateDraft((c) => ({ ...c, schemas }))}
                  addLabel="Add schema"
                  emptyText="No structured data added."
                  placeholder="Paste JSON or a JSON-LD <script> block"
                />
              </Panel>
            ) : null}
          </>
        }
        sidebar={
          <>
            <PublishBox isNew={false} updatedAt={selectedPage?.updatedAt} viewHref={draft.path} onSave={() => void save()} saving={saving} saveLabel="Update page" />
            <MetaBox title="Sections">
              <ol className="-mx-1 max-h-[60vh] space-y-0.5 overflow-y-auto">
                {sections.map((sec, i) => {
                  const active = tab === "content" && activeSection?.id === sec.id;
                  const changed = sectionChanged(sec.id);
                  const headline = sectionHeadline(sec);
                  return (
                    <li key={sec.id}>
                      <button
                        type="button"
                        onClick={() => go(i)}
                        className={`flex w-full items-start gap-2 rounded px-2 py-1.5 text-left ${active ? "bg-accent/10 text-accent" : "text-slate-700 hover:bg-slate-100"}`}
                        aria-current={active ? "true" : undefined}
                      >
                        <span className={`mt-0.5 w-5 shrink-0 text-right text-xs tabular-nums ${active ? "text-accent" : "text-slate-400"}`}>{i + 1}.</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-medium">{sec.title}</span>
                            {changed ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" title="Unsaved changes" /> : null}
                          </span>
                          <span className="block truncate text-[11px] text-slate-500">{headline || sectionSummary(sec)}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </MetaBox>
          </>
        }
      />
    </>
  );
};

export default PageManager;
