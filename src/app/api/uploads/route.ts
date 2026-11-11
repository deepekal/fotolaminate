import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@server/lib/route-helpers";
import { listImages, saveImage } from "@server/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authError = requireAdmin(req);
  if (authError) return authError;
  return NextResponse.json(await listImages());
}

export async function POST(req: Request) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const form = await req.formData().catch(() => null);
  if (!form) return jsonError(400, "Invalid multipart form-data");
  const file = form.get("image");
  if (!(file instanceof File)) return jsonError(400, "No file provided (field name: image)");

  try {
    const saved = await saveImage(Buffer.from(await file.arrayBuffer()), file.name);
    return NextResponse.json(saved, { status: 201 });
  } catch (e) {
    return jsonError(400, e instanceof Error ? e.message : "Upload failed");
  }
}
