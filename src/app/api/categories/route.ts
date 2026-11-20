import { NextResponse } from "next/server";
import { query } from "@server/lib/db";
import { jsonError, pgToResponse, requireAdmin } from "@server/lib/route-helpers";
import { normalizeCategoryName, type CategoryRecord } from "@/lib/categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** All categories (public) with the number of products currently using each name. */
export const CATEGORY_LIST_SQL = `
  select c.*,
         (select count(*)::int from public.products p where lower(trim(p.category)) = lower(c.name)) as product_count
  from public.product_categories c
  order by c.sort_order, c.name`;

function isUniqueViolation(e: unknown) {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "23505";
}

export async function GET() {
  try {
    const r = await query<CategoryRecord>(CATEGORY_LIST_SQL);
    return NextResponse.json(r.rows);
  } catch (e) {
    return pgToResponse(e);
  }
}

export async function POST(req: Request) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const n = normalizeCategoryName(body.name);
  if (!n.ok) return jsonError(400, n.error);
  const description = typeof body.description === "string" && body.description.trim() ? body.description.trim() : null;
  const sortOrder = Number.isFinite(Number(body.sort_order)) ? Math.trunc(Number(body.sort_order)) : 0;

  try {
    const r = await query<CategoryRecord>(
      `insert into public.product_categories (name, slug, description, sort_order)
       values ($1, $2, $3, $4) returning *`,
      [n.name, n.slug, description, sortOrder],
    );
    return NextResponse.json({ ...r.rows[0], product_count: 0 }, { status: 201 });
  } catch (e) {
    if (isUniqueViolation(e)) return jsonError(409, "Category already exists");
    return pgToResponse(e);
  }
}
