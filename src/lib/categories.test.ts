import { describe, it, expect } from "vitest";
import { normalizeCategoryName } from "@/lib/categories";

describe("normalizeCategoryName", () => {
  it("trims and slugifies", () => {
    expect(normalizeCategoryName("  Cutting  Machine ")).toEqual({ ok: true, name: "Cutting Machine", slug: "cutting-machine" });
  });
  it("handles ampersand", () => {
    expect(normalizeCategoryName("Machine Accessories & Raw Materials")).toMatchObject({ ok: true, slug: "machine-accessories-and-raw-materials" });
  });
  it("rejects blank", () => {
    expect(normalizeCategoryName("   ")).toEqual({ ok: false, error: "Name is required" });
  });
  it("rejects >80 chars", () => {
    expect(normalizeCategoryName("x".repeat(81))).toEqual({ ok: false, error: "Name must be 80 characters or fewer" });
  });
  it("rejects non-string", () => {
    expect(normalizeCategoryName(5).ok).toBe(false);
  });
});
