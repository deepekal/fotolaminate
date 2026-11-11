import { NextResponse } from "next/server";

type PgErrorLike = {
  code?: string;
  message?: string;
};

function isPgErrorLike(value: unknown): value is PgErrorLike {
  return typeof value === "object" && value !== null;
}

export function jsonError(status: number, error: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error, ...(extra ?? {}) }, { status });
}

export function getBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

/** True when the request carries the admin token (dashboard). Public visitors only see published content. */
export function isAdminRequest(req: Request) {
  const adminToken = process.env.ADMIN_TOKEN ?? "";
  return Boolean(adminToken) && getBearerToken(req) === adminToken;
}

export function requireAdmin(req: Request) {
  const adminToken = process.env.ADMIN_TOKEN ?? "";
  if (!adminToken) return jsonError(500, "ADMIN_TOKEN is not set on the server");

  const token = getBearerToken(req);
  if (!token || token !== adminToken) return jsonError(401, "Unauthorized");

  return null;
}

export function pgToResponse(err: unknown) {
  if (isPgErrorLike(err) && err.code === "42P01") {
    return jsonError(
      500,
      "Database schema is not installed (missing tables). Run server/schema.sql in the Supabase SQL editor, then retry.",
      { pgCode: err.code },
    );
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  return jsonError(500, message);
}
