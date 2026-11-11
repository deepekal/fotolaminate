import { NextResponse, type NextRequest } from "next/server";
import { query } from "@server/lib/db";
import { isAdminRequest, jsonError, pgToResponse } from "@server/lib/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    const r = await query(`select * from public.blog_posts where slug = $1 ${isAdminRequest(req) ? "" : "and published = true"} limit 1`,
      [slug]);
    if (!r.rows[0]) return jsonError(404, "Blog post not found");
    return NextResponse.json(r.rows[0]);
  } catch (e) {
    return pgToResponse(e);
  }
}
