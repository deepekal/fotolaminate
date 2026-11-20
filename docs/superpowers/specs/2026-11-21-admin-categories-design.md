# Admin Categories section — design (approved 21 Nov 2026)

## Intent
Owner wants to manage product categories from /dashboard: list, add, edit (rename), delete.
Today "category" is free text on `products.category`; footer and contact dropdown lists are hardcoded.

## Goals
- Categories tab in admin with list + add/edit/delete, matching existing table style.
- Renaming a category updates all products using it.
- Deleting a category in use is blocked (or reassigns to another chosen category).
- Product editor picks category from the managed list.
- Footer, /products/category/[slug] pages and contact dropdown read categories from DB.

## Non-goals
- No category images/SEO fields (can be added later). No deploy in this task.

## Approaches
1. **Dedicated `product_categories` table (chosen)** — durable, ordering, empty categories allowed, removes hardcoded lists. Needs one migration on live DB.
2. Distinct names from products only — no migration but no ordering/empty categories, hardcoded lists remain.

## Decisions
- Table: `product_categories(id uuid pk default gen_random_uuid(), name text unique not null, slug text unique not null, description text, sort_order int default 0, created_at, updated_at)`. Seed from distinct existing `products.category` values + the 7 footer names. Keep `products.category` text column (name) for compatibility; rename cascades via UPDATE.
- API: `GET/POST /api/categories`, `PATCH/DELETE /api/categories/[id]`; writes require admin (same helpers as products). DELETE returns 409 with product count when in use unless `?moveTo=<id>` given. Response includes `product_count`.
- Admin: `CategoryManager.tsx` in `src/components/dashboard`, nav entry "Categories" (Tags icon), hash route `#/categories`. Table columns: Name, Slug, Products, Updated; row actions Edit / Delete; inline side form for add/edit; confirm dialog for delete.
- Product editor: replace radio list + "New category" with a `<select>` from `api.categories.list()`, plus link "Manage categories".
- Public: Footer, Contact dropdown (machine type) and category page lookup query the table (server-side, ordered by sort_order, name).
- Tests: vitest for slug/validation helpers and API route handlers with mocked `query`.
- Migration SQL in `deploy/` + applied to local DB; work on branch `feat/admin-categories`.
