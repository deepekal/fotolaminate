export type ApiErrorBody = { error: string };

import type { Response } from "express";

export function jsonError(res: Response, status: number, message: string) {
  return res.status(status).json({ error: message } satisfies ApiErrorBody);
}

export function safeJsonParse(input: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    const value = JSON.parse(input);
    return { ok: true, value };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invalid JSON" };
  }
}
