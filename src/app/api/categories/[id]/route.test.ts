import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@server/lib/db", () => ({ query: vi.fn() }));
import { query } from "@server/lib/db";
import { PATCH, DELETE } from "./route";

const q = query as unknown as ReturnType<typeof vi.fn>;
const admin = { Authorization: "Bearer t" };
const ctx = { params: Promise.resolve({ id: "c1" }) };
const existing = { id: "c1", name: "Old Name", slug: "old-name", description: null, sort_order: 10 };
const patch = (body: unknown, headers: Record<string, string> = admin) =>
  PATCH(new Request("http://x/api/categories/c1", { method: "PATCH", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) }), ctx);
const del = (qs = "", headers: Record<string, string> = admin) =>
  DELETE(new Request(`http://x/api/categories/c1${qs}`, { method: "DELETE", headers }), ctx);

beforeEach(() => {
  process.env.ADMIN_TOKEN = "t";
  q.mockReset();
});

describe("PATCH /api/categories/:id", () => {
  it("rejects without admin token", async () => {
    expect((await patch({ name: "X" }, {})).status).toBe(401);
    expect(q).not.toHaveBeenCalled();
  });
  it("returns 404 for unknown id", async () => {
    q.mockResolvedValueOnce({ rows: [] });
    expect((await patch({ name: "X" })).status).toBe(404);
  });
  it("renames and cascades the new name to products using the old name", async () => {
    q.mockResolvedValueOnce({ rows: [existing] }) // select existing
      .mockResolvedValueOnce({ rows: [{ ...existing, name: "New Name", slug: "new-name" }] }) // update category
      .mockResolvedValueOnce({ rowCount: 4, rows: [] }); // update products
    const res = await patch({ name: "New Name" });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ name: "New Name", slug: "new-name" });
    const productsUpdate = q.mock.calls[2];
    expect(String(productsUpdate[0])).toMatch(/update public\.products set category/i);
    expect(productsUpdate[1]).toEqual(["New Name", "Old Name"]);
  });
  it("does not touch products when the name is unchanged", async () => {
    q.mockResolvedValueOnce({ rows: [existing] }).mockResolvedValueOnce({ rows: [{ ...existing, description: "d" }] });
    const res = await patch({ description: "d" });
    expect(res.status).toBe(200);
    expect(q).toHaveBeenCalledTimes(2);
  });
  it("returns 409 when renaming to an existing name", async () => {
    q.mockResolvedValueOnce({ rows: [existing] }).mockRejectedValueOnce({ code: "23505" });
    expect((await patch({ name: "Cutting Machine" })).status).toBe(409);
  });
});

describe("DELETE /api/categories/:id", () => {
  it("rejects without admin token", async () => {
    expect((await del("", {})).status).toBe(401);
  });
  it("returns 404 for unknown id", async () => {
    q.mockResolvedValueOnce({ rows: [] });
    expect((await del()).status).toBe(404);
  });
  it("blocks delete with 409 and product_count when in use and no moveTo", async () => {
    q.mockResolvedValueOnce({ rows: [existing] }).mockResolvedValueOnce({ rows: [{ count: 3 }] });
    const res = await del();
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ error: "Category is in use", product_count: 3 });
    expect(q).toHaveBeenCalledTimes(2);
  });
  it("moves products to moveTo category then deletes", async () => {
    q.mockResolvedValueOnce({ rows: [existing] }) // existing
      .mockResolvedValueOnce({ rows: [{ count: 3 }] }) // in-use count
      .mockResolvedValueOnce({ rows: [{ id: "c2", name: "Target" }] }) // target lookup
      .mockResolvedValueOnce({ rowCount: 3, rows: [] }) // move products
      .mockResolvedValueOnce({ rowCount: 1, rows: [] }); // delete
    const res = await del("?moveTo=c2");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, moved: 3 });
    expect(q.mock.calls[3][1]).toEqual(["Target", "Old Name"]);
  });
  it("returns 400 when moveTo is the same category or unknown", async () => {
    q.mockResolvedValueOnce({ rows: [existing] }).mockResolvedValueOnce({ rows: [{ count: 3 }] }).mockResolvedValueOnce({ rows: [] });
    expect((await del("?moveTo=zzz")).status).toBe(400);
  });
  it("deletes an unused category directly", async () => {
    q.mockResolvedValueOnce({ rows: [existing] }).mockResolvedValueOnce({ rows: [{ count: 0 }] }).mockResolvedValueOnce({ rowCount: 1, rows: [] });
    const res = await del();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, moved: 0 });
  });
});
