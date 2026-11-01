import { NextResponse } from "next/server";
import { jsonError } from "@server/lib/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeJsonParse(input: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    const value = JSON.parse(input);
    return { ok: true, value };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invalid JSON" };
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const input = body.input;
  if (typeof input !== "string") return jsonError(400, "input must be a string");

  const trimmed = input.trim();
  if (trimmed.startsWith("<script")) {
    const start = trimmed.indexOf(">") + 1;
    const end = trimmed.lastIndexOf("</script>");
    if (start <= 0 || end <= start) return jsonError(400, "Invalid <script> block");
    const inner = trimmed.slice(start, end).trim();
    const parsed = safeJsonParse(inner);
    if (!parsed.ok) return jsonError(400, parsed.error);
    return NextResponse.json({ ok: true, json: parsed.value });
  }

  const parsed = safeJsonParse(trimmed);
  if (!parsed.ok) return jsonError(400, parsed.error);
  return NextResponse.json({ ok: true, json: parsed.value });
}
