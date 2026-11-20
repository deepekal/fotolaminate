import { describe, it, expect } from "vitest";
import { normalizeProductCode, compareSize, compareProductCode } from "@/lib/product-table";

describe("normalizeProductCode", () => {
  it("uppercases and trims", () => expect(normalizeProductCode("  cm-01 ")).toBe("CM-01"));
  it("returns null for blank", () => expect(normalizeProductCode("   ")).toBeNull());
  it("rejects over 20 chars by truncating", () => expect(normalizeProductCode("x".repeat(25))).toBe("X".repeat(20)));
});

describe("compareSize", () => {
  it("sorts numerically within the same unit", () => {
    expect(["12 inch", "3 mm", "20 inch", "45°", "A4", ""].sort(compareSize)).toEqual(["3 mm", "12 inch", "20 inch", "45°", "A4", ""]);
  });
  it("puts blanks last", () => expect(compareSize("", "A4")).toBeGreaterThan(0));
});

describe("compareProductCode", () => {
  it("orders CM-2 before CM-10 and uncoded products last", () => {
    const rows = [{ product_code: "CM-10" }, { product_code: null }, { product_code: "CM-2" }, { product_code: "CM-01" }];
    expect(rows.sort(compareProductCode).map((r) => r.product_code)).toEqual(["CM-01", "CM-2", "CM-10", null]);
  });
});
