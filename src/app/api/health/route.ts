import { NextResponse } from "next/server";
import { query } from "@server/lib/db";
import { pgToResponse } from "@server/lib/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const r = await query<{ now: string }>("select now()::text as now");
    return NextResponse.json({ ok: true, now: r.rows[0]?.now ?? null });
  } catch (e) {
    return pgToResponse(e);
  }
}
