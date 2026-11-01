import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@server/lib/route-helpers";
import { readPageContentList, writePageContentList } from "@server/lib/page-data";
import type { PageContent, PageField, PageSection, PageFieldKey } from "@/lib/page-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isPageFieldKey(value: unknown): value is PageFieldKey {
  return value === "h1" || value === "h2" || value === "h3" || value === "p" || value === "image";
}

function parsePageField(field: unknown): PageField | null {
  if (typeof field !== "object" || field === null) return null;
  const { key, label, value } = field as any;
  if (!isPageFieldKey(key)) return null;
  return {
    key,
    label: typeof label === "string" ? label : "",
    value: typeof value === "string" ? value : "",
  };
}

function parsePageSection(section: unknown, existingSections: PageSection[]): PageSection | null {
  if (typeof section !== "object" || section === null) return null;
  const { id, title, type, fields, faqs } = section as any;
  const sectionId = typeof id === "string" ? id : "";
  const sectionTitle = typeof title === "string" ? title : "";
  const sectionType: "standard" | "faq" = type === "faq" ? "faq" : "standard";

  if (sectionType === "faq") {
    // FAQ section
    const parsedFaqs = Array.isArray(faqs)
      ? faqs.map(parseFAQ).filter((faq): faq is { q: string; a: string } => faq !== null)
      : existingSections.find((existing) => existing.id === sectionId)?.faqs ?? [];

    return {
      id: sectionId,
      title: sectionTitle,
      type: "faq",
      faqs: parsedFaqs,
    };
  }

  // Standard section (default)
  const parsedFields = Array.isArray(fields)
    ? fields.map(parsePageField).filter((field): field is PageField => field !== null)
    : existingSections.find((existing) => existing.id === sectionId)?.fields ?? [];

  return {
    id: sectionId,
    title: sectionTitle,
    type: "standard",
    fields: parsedFields,
  };
}

function parseFAQ(faq: unknown): { q: string; a: string } | null {
  if (typeof faq !== "object" || faq === null) return null;
  const { q, a } = faq as any;
  if (typeof q !== "string" || typeof a !== "string") return null;
  return { q, a };
}

export async function PUT(req: Request, ctx: { params: Promise<{ pageId: string }> }) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { pageId } = await ctx.params;
    const body = (await req.json().catch(() => null)) as null | Record<string, unknown>;
    if (!body) return jsonError(400, "Request body is required");

    const pages = await readPageContentList();
    const index = pages.findIndex((page) => page.pageId === pageId);
    if (index < 0) return jsonError(404, "Page not found");

    const existing = pages[index];
    const updatedPage: PageContent = {
      ...existing,
      name: typeof body.name === "string" ? body.name : existing.name,
      path: typeof body.path === "string" ? body.path : existing.path,
      seo: {
        title: typeof body.seo === "object" && body.seo !== null && typeof (body.seo as any).title === "string"
          ? (body.seo as any).title
          : existing.seo.title,
        description:
          typeof body.seo === "object" && body.seo !== null && typeof (body.seo as any).description === "string"
            ? (body.seo as any).description
            : existing.seo.description,
        keywords:
          typeof body.seo === "object" && body.seo !== null && Array.isArray((body.seo as any).keywords)
            ? (body.seo as any).keywords.filter((item: unknown) => typeof item === "string")
            : existing.seo.keywords,
      },
      // Accept schemas from the request body and preserve existing schemas if absent
      schemas: Array.isArray(body.schemas) ? (body.schemas as unknown[]) : existing.schemas ?? [],
      // Accept FAQs from the request body and preserve existing FAQs if absent
      faqs: Array.isArray(body.faqs)
        ? (body.faqs as unknown[]).map(parseFAQ).filter((faq): faq is { q: string; a: string } => faq !== null)
        : existing.faqs ?? [],
      sections:
        Array.isArray(body.sections)
          ? (body.sections as unknown[])
              .map((section) => parsePageSection(section, existing.sections))
              .filter((section): section is PageSection => section !== null)
          : existing.sections,
    };

    pages[index] = updatedPage;
    await writePageContentList(pages);
    return NextResponse.json(updatedPage);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update page";
    return jsonError(500, message);
  }
}
