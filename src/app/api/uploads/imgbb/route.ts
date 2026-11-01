import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@server/lib/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const imgbbApiKey = process.env.IMGBB_API_KEY ?? "";
  if (!imgbbApiKey) return jsonError(500, "IMGBB_API_KEY is not set on the server");

  const form = await req.formData().catch(() => null);
  if (!form) return jsonError(400, "Invalid multipart form-data");

  const file = form.get("image");
  if (!(file instanceof File)) return jsonError(400, "No file provided (field name: image)");

  const bytes = Buffer.from(await file.arrayBuffer());
  const b64 = bytes.toString("base64");

  const body = new URLSearchParams();
  body.set("key", imgbbApiKey);
  body.set("image", b64);

  const response = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    return jsonError(502, `ImgBB upload failed: ${text}`);
  }

  const json = (await response.json()) as unknown;
  const url =
    typeof json === "object" && json !== null
      ? (((json as { data?: unknown }).data as { url?: unknown } | undefined)?.url as string | undefined)
      : undefined;

  if (!url) return jsonError(502, "ImgBB response missing image URL");

  return NextResponse.json({ url });
}
