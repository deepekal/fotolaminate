import { NextResponse, type NextRequest } from "next/server";
import { query } from "@server/lib/db";
import { jsonError, pgToResponse } from "@server/lib/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    const r = await query("select * from public.products where slug = $1 limit 1", [slug]);
    if (!r.rows[0]) return jsonError(404, "Product not found");
    return NextResponse.json(r.rows[0]);
  } catch (e) {
    return pgToResponse(e);
  }
}
