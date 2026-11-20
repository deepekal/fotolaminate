import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@server/lib/db", () => ({ query: vi.fn() }));
import { query } from "@server/lib/db";
import { GET, POST } from "./route";

const q = query as unknown as ReturnType<typeof vi.fn>;
const admin = { Authorization: "Bearer t" };
const post = (body: unknown, headers: Record<string, string> = admin) =>
  POST(new Request("http://x/api/categories", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) }));

beforeEach(() => {
  process.env.ADMIN_TOKEN = "t";
  q.mockReset();
});

describe("GET /api/categories", () => {
  it("returns rows ordered by sort_order with product_count", async () => {
    q.mockResolvedValue({ rows: [{ id: "1", name: "A", slug: "a", product_count: 2 }] });
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: "1", name: "A", slug: "a", product_count: 2 }]);
    const sql = String(q.mock.calls[0][0]);
    expect(sql).toContain("product_categories");
    expect(sql).toContain("order by c.sort_order");
    expect(sql).toContain("product_count");
    expect(sql).toContain("cover_image_url");
  });
});

describe("POST /api/categories", () => {
  it("rejects without admin token", async () => {
    const res = await post({ name: "X" }, {});
    expect(res.status).toBe(401);
    expect(q).not.toHaveBeenCalled();
  });
  it("rejects blank name", async () => {
    const res = await post({ name: "   " });
    expect(res.status).toBe(400);
    expect(q).not.toHaveBeenCalled();
  });
  it("returns 409 on duplicate", async () => {
    q.mockRejectedValue({ code: "23505" });
    const res = await post({ name: "Cutting Machine" });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("Category already exists");
  });
  it("creates and returns 201 with slug", async () => {
    q.mockResolvedValue({ rows: [{ id: "1", name: "Cutting Machine", slug: "cutting-machine" }] });
    const res = await post({ name: "  Cutting  Machine ", description: "d", sort_order: 5 });
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ slug: "cutting-machine" });
    expect(q.mock.calls[0][1]).toEqual(["Cutting Machine", "cutting-machine", "d", 5]);
  });
});
