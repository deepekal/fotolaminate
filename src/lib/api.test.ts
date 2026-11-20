import { describe, it, expect, vi, afterEach } from "vitest";
import { api, ApiError } from "@/lib/api";

afterEach(() => vi.unstubAllGlobals());

describe("apiFetch errors", () => {
  it("throws an ApiError carrying status and the parsed body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ ok: false, error: "Category is in use", product_count: 3 }), { status: 409, headers: { "content-type": "application/json" } })),
    );
    const err = await api.categories.remove("c1").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe("Category is in use");
    expect(err.status).toBe(409);
    expect(err.body).toMatchObject({ product_count: 3 });
  });
});
