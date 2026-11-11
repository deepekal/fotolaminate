import { NextResponse } from "next/server";
import { jsonError } from "@server/lib/route-helpers";
import { adminUsersConfigured, checkCredentials, clientIp, lockRemaining, recordFailure, recordSuccess } from "@server/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const adminToken = process.env.ADMIN_TOKEN ?? "";
  if (!adminToken) return jsonError(500, "ADMIN_TOKEN is not set on the server");
  if (!adminUsersConfigured()) return jsonError(500, "No admin users are configured on the server");

  const body = (await req.json().catch(() => null)) as null | { username?: unknown; password?: unknown };
  if (!body || typeof body.username !== "string" || typeof body.password !== "string") {
    return jsonError(400, "username and password are required");
  }

  const ip = clientIp(req);
  const wait = lockRemaining(ip, body.username);
  if (wait > 0) {
    const minutes = Math.ceil(wait / 60000);
    return jsonError(429, `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
  }

  if (!checkCredentials(body.username, body.password)) {
    recordFailure(ip, body.username);
    return jsonError(401, "Invalid credentials");
  }

  recordSuccess(ip, body.username);
  return NextResponse.json({ token: adminToken });
}
