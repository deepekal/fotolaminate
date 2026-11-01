import { NextResponse } from "next/server";
import { readPageContentList } from "@server/lib/page-data";
import { jsonError } from "@server/lib/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pages = await readPageContentList();
    return NextResponse.json(pages);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load pages";
    return jsonError(500, message);
  }
}
