import { NextResponse } from "next/server";
import { query } from "@server/lib/db";
import { isAdminRequest, jsonError, pgToResponse, requireAdmin } from "@server/lib/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const r = await query(
      `select id, title, slug, meta_title, meta_description, tags, keywords, cover_image_url, og_image_url, faqs, published, created_at, updated_at,
              left(content, 220) as excerpt
       from public.blog_posts
       ${isAdminRequest(req) ? "" : "where published = true"}
       order by created_at desc`,
    );
    return NextResponse.json(r.rows);
  } catch (e) {
    return pgToResponse(e);
  }
}

export async function POST(req: Request) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    if (!body.title || !body.slug) return jsonError(400, "Title and slug are required");

    const schemas = Array.isArray(body.schemas) ? body.schemas : [];
    const faqs = Array.isArray(body.faqs) ? body.faqs : [];

    const r = await query(
      `insert into public.blog_posts
        (title, slug, meta_title, meta_description, tags, keywords, schemas, cover_image_url, og_image_url, content, faqs, published)
       values
        ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11::jsonb,$12)
       returning *`,
      [
        String(body.title),
        String(body.slug),
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

    return NextResponse.json(r.rows[0], { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create post";
    if (msg.includes("duplicate key") || msg.includes("unique")) return jsonError(409, "Slug already exists");
    return pgToResponse(e);
  }
}
