import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@server/lib/route-helpers";
import { deleteImage } from "@server/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(req: Request, ctx: { params: Promise<{ name: string }> }) {
  const authError = requireAdmin(req);
  if (authError) return authError;
  const { name } = await ctx.params;
  try {
    await deleteImage(name);
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError(404, "Image not found");
  }
}
