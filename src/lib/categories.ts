import { slugifyCategory } from "@/lib/slug";

export type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  product_count?: number;
};

export const CATEGORY_NAME_MAX = 80;

export function normalizeCategoryName(
  input: unknown,
): { ok: true; name: string; slug: string } | { ok: false; error: string } {
  if (typeof input !== "string") return { ok: false, error: "Name is required" };
  const name = input.trim().replace(/\s+/g, " ");
  if (!name) return { ok: false, error: "Name is required" };
  if (name.length > CATEGORY_NAME_MAX) return { ok: false, error: `Name must be ${CATEGORY_NAME_MAX} characters or fewer` };
  return { ok: true, name, slug: slugifyCategory(name) };
}
