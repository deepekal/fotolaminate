import { NextResponse } from "next/server";
import { query } from "@server/lib/db";
import { jsonError, pgToResponse, requireAdmin } from "@server/lib/route-helpers";
import { normalizeCategoryName, type CategoryRecord } from "@/lib/categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function isUniqueViolation(e: unknown) {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "23505";
}

async function findCategory(id: string) {
  const r = await query<CategoryRecord>("select * from public.product_categories where id = $1", [id]);
  return r.rows[0] ?? null;
}

async function countProducts(name: string) {
  const r = await query<{ count: number }>(
    "select count(*)::int as count from public.products where lower(trim(category)) = lower($1)",
    [name],
  );
  return Number(r.rows[0]?.count ?? 0);
}

// Note: the rename / move-then-delete sequences run as separate queries rather than one
// transaction (the shared pool helper has no transaction API). A failure midway leaves the
// category row changed but products untouched; re-running the action repairs it.

export async function PATCH(req: Request, ctx: Ctx) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { id } = await ctx.params;
    const existing = await findCategory(id);
    if (!existing) return jsonError(404, "Category not found");

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    let name = existing.name;
    let slug = existing.slug;
    if (body.name !== undefined) {
      const n = normalizeCategoryName(body.name);
      if (!n.ok) return jsonError(400, n.error);
      name = n.name;
      slug = n.slug;
    }
    const description =
      body.description === undefined ? existing.description : typeof body.description === "string" && body.description.trim() ? body.description.trim() : null;
    const sortOrder = body.sort_order === undefined ? existing.sort_order : Number.isFinite(Number(body.sort_order)) ? Math.trunc(Number(body.sort_order)) : existing.sort_order;

    let updated: CategoryRecord;
    try {
      const r = await query<CategoryRecord>(
        `update public.product_categories
         set name = $2, slug = $3, description = $4, sort_order = $5, updated_at = now()
         where id = $1 returning *`,
        [id, name, slug, description, sortOrder],
      );
      updated = r.rows[0];
    } catch (e) {
      if (isUniqueViolation(e)) return jsonError(409, "Category already exists");
      throw e;
    }

    if (name !== existing.name) {
      await query("update public.products set category = $1, updated_at = now() where lower(trim(category)) = lower($2)", [name, existing.name]);
    }
    return NextResponse.json(updated);
  } catch (e) {
    return pgToResponse(e);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { id } = await ctx.params;
    const existing = await findCategory(id);
    if (!existing) return jsonError(404, "Category not found");

    const inUse = await countProducts(existing.name);
    const moveTo = new URL(req.url).searchParams.get("moveTo");
    let moved = 0;

    if (inUse > 0) {
      if (!moveTo) return jsonError(409, "Category is in use", { product_count: inUse });
      const target = moveTo === id ? null : await findCategory(moveTo);
      if (!target) return jsonError(400, "Choose a different category to move the products to");
      const r = await query("update public.products set category = $1, updated_at = now() where lower(trim(category)) = lower($2)", [target.name, existing.name]);
      moved = r.rowCount ?? inUse;
    }

    await query("delete from public.product_categories where id = $1", [id]);
    return NextResponse.json({ ok: true, moved });
  } catch (e) {
    return pgToResponse(e);
  }
}
