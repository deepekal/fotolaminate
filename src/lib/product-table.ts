import type { ProductRecord } from "@/lib/api";

export const PRODUCT_CODE_MAX = 20;

/** Owner-typed product code (e.g. CM-01): trimmed, upper-cased, max 20 chars; null when blank. */
export function normalizeProductCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const v = input.trim().toUpperCase().replace(/\s+/g, " ").slice(0, PRODUCT_CODE_MAX);
  return v || null;
}

/** Natural sort for size strings: leading number first, then text; blanks last. */
export function compareSize(a: string, b: string): number {
  const sa = a.trim();
  const sb = b.trim();
  if (!sa && !sb) return 0;
  if (!sa) return 1;
  if (!sb) return -1;
  const na = sa.match(/^(\d+(?:\.\d+)?)/);
  const nb = sb.match(/^(\d+(?:\.\d+)?)/);
  if (na && nb) {
    const d = parseFloat(na[1]) - parseFloat(nb[1]);
    if (d !== 0) return d;
  } else if (na) return -1;
  else if (nb) return 1;
  return sa.localeCompare(sb, undefined, { numeric: true, sensitivity: "base" });
}

/** Rows for the category table: products of one category, in the order given. */
export type ProductTableRow = Pick<ProductRecord, "id" | "name" | "slug" | "summary" | "cover_image_url" | "updated_at" | "product_code" | "size">;

/** Natural order by product code (CM-2 before CM-10); products without a code keep to the end. */
export function compareProductCode(a: { product_code?: string | null }, b: { product_code?: string | null }): number {
  const ca = a.product_code ?? "";
  const cb = b.product_code ?? "";
  if (!ca && !cb) return 0;
  if (!ca) return 1;
  if (!cb) return -1;
  return ca.localeCompare(cb, undefined, { numeric: true, sensitivity: "base" });
}
