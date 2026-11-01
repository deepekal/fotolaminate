import { NextResponse, type NextRequest } from "next/server";
import { query } from "@server/lib/db";
import { jsonError, pgToResponse, requireAdmin } from "@server/lib/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    // Parse and validate FAQs
    let faqsJson: unknown[] = [];
    if (Array.isArray(body.faqs)) {
      faqsJson = body.faqs.filter((faq) => 
        typeof faq === "object" && 
        faq !== null && 
        typeof (faq as any).q === "string" && 
        typeof (faq as any).a === "string"
      );
    }

    const r = await query(
      `update public.products set
          name = $2,
          slug = $3,
          category = $4,
          summary = $5,
          description = $6,
          features = $7,
          specs = $8::jsonb,
          meta_title = $9,
          meta_description = $10,
          keywords = $11,
          cover_image_url = $12,
          og_image_url = $13,
          gallery_image_urls = $14,
          faqs = $15::jsonb,
          published = $16,
          video_url = $17
       where id = $1
       returning *`,
      [
        id,
        String(body.name ?? ""),
        String(body.slug ?? ""),
        body.category ? String(body.category) : null,
        body.summary ? String(body.summary) : null,
        body.description ? String(body.description) : "",
        Array.isArray(body.features) ? body.features.map(String) : [],
        JSON.stringify(body.specs ?? {}),
        body.meta_title ? String(body.meta_title) : null,
        body.meta_description ? String(body.meta_description) : null,
        Array.isArray(body.keywords) ? body.keywords.map(String) : [],
        body.cover_image_url ? String(body.cover_image_url) : null,
        body.og_image_url ? String(body.og_image_url) : null,
        Array.isArray(body.gallery_image_urls) ? body.gallery_image_urls.map(String) : [],
        JSON.stringify(faqsJson),
        body.published === false ? false : true,
        body.video_url ? String(body.video_url) : null,
      ],
    );

    if (!r.rows[0]) return jsonError(404, "Product not found");
    return NextResponse.json(r.rows[0]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update product";
    if (msg.includes("duplicate key") || msg.includes("unique")) return jsonError(409, "Slug already exists");
    return pgToResponse(e);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { id } = await ctx.params;
    const r = await query("delete from public.products where id = $1 returning id", [id]);
    if (!r.rows[0]) return jsonError(404, "Product not found");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return pgToResponse(e);
  }
}
