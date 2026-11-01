import { NextResponse } from "next/server";
import { query } from "@server/lib/db";
import { jsonError, pgToResponse, requireAdmin } from "@server/lib/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const r = await query(
      `select *
       from public.products
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
    if (!body.name || !body.slug) return jsonError(400, "Name and slug are required");

    const r = await query(
      `insert into public.products
        (name, slug, category, summary, description, features, specs,
         meta_title, meta_description, keywords,
         cover_image_url, og_image_url, gallery_image_urls, faqs, published, video_url)
       values
        ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13,$14::jsonb,$15,$16)
       returning *`,
      [
        String(body.name),
        String(body.slug),
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
        JSON.stringify(Array.isArray(body.faqs) ? body.faqs : []),
        body.published === false ? false : true,
        body.video_url ? String(body.video_url) : null,
      ],
    );

    return NextResponse.json(r.rows[0], { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create product";
    if (msg.includes("duplicate key") || msg.includes("unique")) return jsonError(409, "Slug already exists");
    return pgToResponse(e);
  }
}
