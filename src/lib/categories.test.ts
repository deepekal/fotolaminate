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

describe("categorySelectOptions", () => {
  it("keeps a legacy product value that is not in the table", async () => {
    const { categorySelectOptions } = await import("@/lib/categories");
    expect(categorySelectOptions(["A", "B"], "Old")).toEqual(["A", "B", "Old"]);
  });
  it("does not duplicate a value already in the table or add blanks", async () => {
    const { categorySelectOptions } = await import("@/lib/categories");
    expect(categorySelectOptions(["A", "B"], "B")).toEqual(["A", "B"]);
    expect(categorySelectOptions(["A"], "")).toEqual(["A"]);
  });
});

describe("categorySelectOptions with padded legacy values", () => {
  it("appends the value exactly as stored so the select can match it", async () => {
    const { categorySelectOptions } = await import("@/lib/categories");
    expect(categorySelectOptions(["A"], " Old ")).toEqual(["A", " Old "]);
  });
});
