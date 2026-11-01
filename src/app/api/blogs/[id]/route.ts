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
    const schemas = Array.isArray(body.schemas) ? body.schemas : [];
    const faqs = Array.isArray(body.faqs) ? body.faqs : [];

    const r = await query(
      `update public.blog_posts set
          title = $2,
          slug = $3,
          meta_title = $4,
          meta_description = $5,
          tags = $6,
          keywords = $7,
          schemas = $8::jsonb,
          cover_image_url = $9,
          og_image_url = $10,
          content = $11,
          faqs = $12::jsonb,
          published = $13
       where id = $1
       returning *`,
      [
        id,
        String(body.title ?? ""),
        String(body.slug ?? ""),
        body.meta_title ? String(body.meta_title) : null,
        body.meta_description ? String(body.meta_description) : null,
        Array.isArray(body.tags) ? body.tags.map(String) : [],
        Array.isArray(body.keywords) ? body.keywords.map(String) : [],
        JSON.stringify(schemas),
        body.cover_image_url ? String(body.cover_image_url) : null,
        body.og_image_url ? String(body.og_image_url) : null,
        body.content ? String(body.content) : "",
        JSON.stringify(faqs),
        body.published === false ? false : true,
      ],
    );

    if (!r.rows[0]) return jsonError(404, "Blog post not found");
    return NextResponse.json(r.rows[0]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update post";
    if (msg.includes("duplicate key") || msg.includes("unique")) return jsonError(409, "Slug already exists");
    return pgToResponse(e);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { id } = await ctx.params;
    const r = await query("delete from public.blog_posts where id = $1 returning id", [id]);
    if (!r.rows[0]) return jsonError(404, "Blog post not found");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return pgToResponse(e);
  }
}
