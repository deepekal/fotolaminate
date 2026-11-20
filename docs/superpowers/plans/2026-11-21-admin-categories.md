# Admin Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A "Categories" section in /dashboard (list, add, edit, delete) backed by a `product_categories` table that also feeds the product editor, footer, contact dropdown and public category pages.

**Architecture:** New Postgres table + migration SQL; two Next.js route handlers under `src/app/api/categories`; `api.categories` client in `src/lib/api.ts`; new `CategoryManager` dashboard component wired into `src/screens/Dashboard.tsx`; public consumers switch from hardcoded lists to the table. `products.category` stays a text name; renames cascade with an UPDATE.

**Tech Stack:** Next.js app router (nodejs runtime), `pg` via `@server/lib/db` `query<T>(text, params)`, React + Tailwind admin kit in `src/components/dashboard/admin-ui.tsx`, vitest (jsdom, globals).

**Spec:** `docs/superpowers/specs/2026-11-21-admin-categories-design.md`

## Global Constraints
- Writes require admin: use `requireAdmin(req)` from `@server/lib/route-helpers`; errors via `jsonError`/`pgToResponse`.
- Route files export `runtime = "nodejs"` and `dynamic = "force-dynamic"` like `src/app/api/products/route.ts`.
- Slug = `slugifyCategory(name)` from `src/lib/slug.ts` (existing public URLs `/products/category/<slug>` must keep working).
- Brand text "Foto Laminate"; no deploy in this plan; work on branch `feat/admin-categories`.
- Tests live in `src/**/*.test.ts`, run with `npx vitest run <file>`.

## Review Focus
- Name with only spaces or >80 chars → 400, not a blank category. (Task 2 test)
- Two names differing only in case/spacing ("Cutting Machine" vs "cutting machine") → 409 duplicate, not two rows. (Task 2 test)
- Delete a category still used by products without `moveTo` → 409 with `product_count`, products untouched. (Task 3 test)
- Rename cascades to every product row using the old name, including drafts. (Task 3 test)
- Product editor must still show a product's legacy category value that is not in the table (select includes it as an option). (Task 5)

---

### Task 1: Table + migration + seed

**Files:**
- Modify: `server/schema.sql` (append table)
- Create: `../deploy/migration_2026-11-21_product_categories.sql`
- Create: `src/lib/categories.ts`
- Test: `src/lib/categories.test.ts`

**Interfaces:**
- Produces: `export type CategoryRecord = { id: string; name: string; slug: string; description: string | null; sort_order: number; created_at: string; updated_at: string; product_count?: number }` and `export function normalizeCategoryName(input: unknown): { ok: true; name: string; slug: string } | { ok: false; error: string }` in `src/lib/categories.ts`.

- [ ] **Step 1: Write failing tests** in `src/lib/categories.test.ts`:
```ts
import { normalizeCategoryName } from "@/lib/categories";
it("trims and slugifies", () => expect(normalizeCategoryName("  Cutting  Machine ")).toEqual({ ok: true, name: "Cutting Machine", slug: "cutting-machine" }));
it("handles ampersand", () => expect(normalizeCategoryName("Machine Accessories & Raw Materials")).toMatchObject({ ok: true, slug: "machine-accessories-and-raw-materials" }));
it("rejects blank", () => expect(normalizeCategoryName("   ")).toEqual({ ok: false, error: "Name is required" }));
it("rejects >80 chars", () => expect(normalizeCategoryName("x".repeat(81))).toEqual({ ok: false, error: "Name must be 80 characters or fewer" }));
it("rejects non-string", () => expect(normalizeCategoryName(5).ok).toBe(false));
```
- [ ] **Step 2:** `npx vitest run src/lib/categories.test.ts` → FAIL (module not found).
- [ ] **Step 3:** Implement `src/lib/categories.ts` (collapse internal whitespace to one space; slug via `slugifyCategory`).
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Migration SQL (same content appended to `server/schema.sql`):
```sql
create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists product_categories_name_key on public.product_categories (lower(name));
create unique index if not exists product_categories_slug_key on public.product_categories (slug);
-- seed: the 7 site categories in display order, then any other names found on products
insert into public.product_categories (name, slug, sort_order) values
 ('Cold Lamination Machine','cold-lamination-machine',10),
 ('Thermal Lamination Machine','thermal-lamination-machine',20),
 ('UV Coating Machine','uv-coating-machine',30),
 ('Karizma Photo Album Machine','karizma-photo-album-machine',40),
 ('Cutting Machine','cutting-machine',50),
 ('Photo Frame Cutting Machine','photo-frame-cutting-machine',60),
 ('Machine Accessories & Raw Materials','machine-accessories-and-raw-materials',70)
on conflict do nothing;
insert into public.product_categories (name, slug, sort_order)
select distinct trim(category), <slug expr>, 100 from public.products
 where coalesce(trim(category),'') <> '' and lower(trim(category)) not in (select lower(name) from public.product_categories)
on conflict do nothing;
```
  `<slug expr>`: `left(regexp_replace(regexp_replace(lower(replace(trim(category),'&',' and ')),'[^a-z0-9]+','-','g'),'(^-+|-+$)','','g'),80)`.
- [ ] **Step 6:** Apply to local DB: `psql "$DATABASE_URL" -f ../deploy/migration_2026-11-21_product_categories.sql` (DATABASE_URL from `.env`) and verify `select name, slug from product_categories order by sort_order` shows the seven rows plus any extras.
- [ ] **Step 7:** Commit `feat: product_categories table, migration and name helper`.

### Task 2: API list + create

**Files:**
- Create: `src/app/api/categories/route.ts`
- Test: `src/app/api/categories/route.test.ts`

**Interfaces:**
- Produces: `GET /api/categories` → `CategoryRecord[]` (with `product_count`, ordered by `sort_order, name`), public. `POST /api/categories` body `{ name, description?, sort_order? }` → 201 `CategoryRecord`; 400 invalid name; 409 `{ error: "Category already exists" }`.
- Consumes: `normalizeCategoryName` (Task 1).

- [ ] **Step 1:** Tests mock `@server/lib/db` (`vi.mock("@server/lib/db", () => ({ query: vi.fn() }))`) and set `process.env.ADMIN_TOKEN="t"`:
  - `GET returns rows from query` (asserts SQL contains `product_categories` and `order by sort_order`).
  - `POST without token → 401`.
  - `POST blank name → 400`.
  - `POST duplicate → 409` (mock `query` rejecting with `{ code: "23505" }`).
  - `POST ok → 201 with slug` (mock resolves `{ rows: [{ id: "1", name: "Cutting Machine", slug: "cutting-machine" }] }`).
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement. List SQL: `select c.*, (select count(*)::int from public.products p where lower(trim(p.category)) = lower(c.name)) as product_count from public.product_categories c order by c.sort_order, c.name`. Insert with `returning *`; catch pg code `23505` → 409.
- [ ] **Step 4:** Run → PASS. **Step 5:** Commit `feat: categories API list/create`.

### Task 3: API update + delete

**Files:**
- Create: `src/app/api/categories/[id]/route.ts`
- Test: `src/app/api/categories/[id]/route.test.ts`

**Interfaces:**
- Produces: `PATCH /api/categories/:id` body `{ name?, description?, sort_order? }` → 200 `CategoryRecord`; on rename also `update public.products set category=$new where lower(trim(category))=lower($old)`. `DELETE /api/categories/:id?moveTo=<id>` → 200 `{ ok: true, moved: n }`; without `moveTo` and products in use → 409 `{ error: "Category is in use", product_count }`; 404 when id unknown.

- [ ] **Step 1:** Tests (same mocking style):
  - `PATCH rename cascades`: mock sequence select old → update category → update products; assert the products UPDATE was called with `[newName, oldName]`.
  - `DELETE in use without moveTo → 409 with product_count 3`.
  - `DELETE with moveTo → reassigns then deletes, returns moved: 3`.
  - `DELETE unknown id → 404`.
  - `PATCH without token → 401`.
- [ ] **Step 2:** FAIL. **Step 3:** Implement (wrap rename and delete-with-move in `begin/commit` using a client from the pool is NOT required; sequential `query` calls are acceptable here, note it in a comment). **Step 4:** PASS. **Step 5:** Commit `feat: categories API update/delete`.

### Task 4: API client

**Files:**
- Modify: `src/lib/api.ts` (add after `products`)

**Interfaces:**
- Produces: `api.categories = { list(): Promise<CategoryRecord[]>; create(p: { name: string; description?: string; sort_order?: number }); update(id, p); remove(id, moveTo?: string) }` using `apiFetch` (which attaches the admin bearer token).

- [ ] Step 1: Add the block; export `CategoryRecord` re-export from `@/lib/categories`. Step 2: `npx tsc --noEmit -p tsconfig.json` passes. Step 3: Commit `feat: api.categories client`.

### Task 5: Dashboard CategoryManager + nav + product editor select

**Files:**
- Create: `src/components/dashboard/CategoryManager.tsx`
- Modify: `src/screens/Dashboard.tsx:17-21` (add `{ id: "categories", label: "Categories", icon: Tags }`), `:272-276` (render `<CategoryManager />`)
- Modify: `src/components/dashboard/ProductManager.tsx:198-210, 471, 562-590`

**Interfaces:**
- Consumes: `api.categories` (Task 4), `AdminTable`, `Panel`, `Field`, `btnPrimary/btnSecondary`, `formatDate`, `useConfirm`.

- [ ] **Step 1:** `CategoryManager`: loads `api.categories.list()`; `AdminTable` columns Name, Slug, Products, Updated; row actions "Edit" and "Delete"; "+ Add category" button opens a right-side `Panel` form (Name, Description, Sort order) used for both add and edit; Save calls create/update then reloads; Delete uses `useConfirm`; if the API returns 409 "in use", show a second dialog with a `<select>` of other categories ("Move N products to…") and call `remove(id, moveTo)`. Error text shown in a red line above the form.
- [ ] **Step 2:** Nav + route in `Dashboard.tsx`; `Tags` icon from lucide-react.
- [ ] **Step 3:** ProductManager: fetch `api.categories.list()` once; replace the radio list + "New category" with `<select>` whose options are the table names plus the draft's current value if missing from the table; add a "Manage categories" link that calls `navigate("/categories")`. Remove now-unused `newCategory` state.
- [ ] **Step 4:** Manual check: `npm run dev` (port 8080), log in at /dashboard, add "Test Cat", rename it, verify a product can select it, delete it, confirm in-use delete is blocked for "Cold Lamination Machine". `npm run lint` and `npx tsc --noEmit` clean.
- [ ] **Step 5:** Commit `feat: Categories section in admin dashboard`.

### Task 6: Public consumers read from the table

**Files:**
- Modify: `src/components/Footer.tsx:20-29` (accept `categories: { name: string; slug: string }[]` prop, fallback to the current constant when empty)
- Modify: the server component that renders `<Footer />` (find with `grep -rn "<Footer" src`) to fetch `select name, slug from public.product_categories order by sort_order, name` via `query` in a `try/catch` and pass it.
- Modify: `src/components/Contact.tsx:94-105` → options from `api.categories.list()` loaded in `useEffect`, static list kept as initial state.
- Modify: `src/app/products/category/[categorySlug]/page.tsx:17-22` → look up `select name from product_categories where slug=$1` first, fall back to the existing distinct-products scan.

- [ ] Step 1: Implement the four changes. Step 2: `npm run build` succeeds; visit `/`, `/contact`, `/products/category/cutting-machine` locally and confirm lists render from the DB (temporarily add a category in admin and see it in the footer after reload). Step 3: Commit `feat: footer, contact and category pages read product_categories`.

### Task 7: Docs

- [ ] Add to `../PENDING.md`: migration file must be run on the live DB before deploying this branch; remove the hardcoded list note. Commit `docs: categories pending notes`.
