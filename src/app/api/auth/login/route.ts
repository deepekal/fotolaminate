import { NextResponse } from "next/server";
import { jsonError } from "@server/lib/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const adminToken = process.env.ADMIN_TOKEN ?? "";
  if (!adminToken) return jsonError(500, "ADMIN_TOKEN is not set on the server");

  const adminUsername = process.env.ADMIN_USERNAME ?? "";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "";
  if (!adminUsername || !adminPassword) {
    return jsonError(500, "ADMIN_USERNAME and ADMIN_PASSWORD must be set on the server");
  }

  const body = (await req.json().catch(() => null)) as null | { username?: unknown; password?: unknown };
  if (!body || typeof body.username !== "string" || typeof body.password !== "string") {
    return jsonError(400, "username and password are required");
  }

  if (body.username !== adminUsername || body.password !== adminPassword) {
    return jsonError(401, "Invalid credentials");
  }

  return NextResponse.json({ token: adminToken });
}
