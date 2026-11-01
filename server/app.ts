import express from "express";
import cors from "cors";
import multer from "multer";

import { env } from "./lib/env";
import { jsonError, safeJsonParse } from "./lib/http";
import { query } from "./lib/db";

export const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

type PgErrorLike = {
  code?: string;
  message?: string;
};

function isPgErrorLike(value: unknown): value is PgErrorLike {
  return typeof value === "object" && value !== null;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadBytes },
});

function getBearerToken(req: express.Request): string | null {
  const header = req.header("authorization") ?? req.header("Authorization");
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!env.adminToken) return jsonError(res, 500, "ADMIN_TOKEN is not set on the server");
  const token = getBearerToken(req);
  if (!token || token !== env.adminToken) return jsonError(res, 401, "Unauthorized");
  return next();
}

app.post("/api/auth/login", (req, res) => {
  if (!env.adminToken) return jsonError(res, 500, "ADMIN_TOKEN is not set on the server");
  if (!env.adminUsername || !env.adminPassword) {
    return jsonError(res, 500, "ADMIN_USERNAME and ADMIN_PASSWORD must be set on the server");
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const username = body.username;
  const password = body.password;

  if (typeof username !== "string" || typeof password !== "string") {
    return jsonError(res, 400, "username and password are required");
  }

  if (username !== env.adminUsername || password !== env.adminPassword) {
    return jsonError(res, 401, "Invalid credentials");
  }

  return res.json({ token: env.adminToken });
});

app.get("/api/health", async (_req, res) => {
  try {
    const r = await query<{ now: string }>("select now()::text as now");
    return res.json({ ok: true, now: r.rows[0]?.now ?? null });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e instanceof Error ? e.message : "health check failed" });
  }
});

// BLOGS
app.get("/api/blogs", async (_req, res) => {
  const r = await query(
    `select id, title, slug, meta_title, meta_description, tags, keywords, cover_image_url, og_image_url, published, created_at, updated_at,
            left(content, 220) as excerpt
     from public.blog_posts
     order by created_at desc`,
  );
  res.json(r.rows);
});

app.get("/api/blogs/slug/:slug", async (req, res) => {
  const { slug } = req.params;
  const r = await query("select * from public.blog_posts where slug = $1 limit 1", [slug]);
  if (!r.rows[0]) return jsonError(res, 404, "Blog post not found");
  res.json(r.rows[0]);
});

app.post("/api/blogs", requireAdmin, async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    if (!body.title || !body.slug) return jsonError(res, 400, "Title and slug are required");

    const schemas = Array.isArray(body.schemas) ? body.schemas : [];
    const faqs = Array.isArray(body.faqs) ? body.faqs : [];

    const r = await query(
      `insert into public.blog_posts
        (title, slug, meta_title, meta_description, tags, keywords, schemas, cover_image_url, og_image_url, content, published, faqs)
       values
        ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12::jsonb)
       returning *`,
      [
        String(body.title),
        String(body.slug),
        body.meta_title ? String(body.meta_title) : null,
        body.meta_description ? String(body.meta_description) : null,
        Array.isArray(body.tags) ? body.tags.map(String) : [],
        Array.isArray(body.keywords) ? body.keywords.map(String) : [],
        JSON.stringify(schemas),
        body.cover_image_url ? String(body.cover_image_url) : null,
        body.og_image_url ? String(body.og_image_url) : null,
        body.content ? String(body.content) : "",
        body.published === false ? false : true,
        JSON.stringify(faqs),
      ],
    );

    res.status(201).json(r.rows[0]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create post";
    if (msg.includes("duplicate key") || msg.includes("unique")) return jsonError(res, 409, "Slug already exists");
    return jsonError(res, 500, msg);
  }
});

app.put("/api/blogs/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const body = (req.body ?? {}) as Record<string, unknown>;

    const schemas = Array.isArray(body.schemas) ? body.schemas : [];
    const faqs = Array.isArray(body.faqs) ? body.faqs : [];

    const r = await query(
      `update public.blog_posts set
          title = $2,
          slug = $3,
          meta_title = $4,
          meta_description = $5,
          tags = $6,
          keywords = $7,
          schemas = $8::jsonb,
          cover_image_url = $9,
          og_image_url = $10,
          content = $11,
          published = $12,
          faqs = $13::jsonb
       where id = $1
       returning *`,
      [
        id,
        String(body.title ?? ""),
        String(body.slug ?? ""),
        body.meta_title ? String(body.meta_title) : null,
        body.meta_description ? String(body.meta_description) : null,
        Array.isArray(body.tags) ? body.tags.map(String) : [],
        Array.isArray(body.keywords) ? body.keywords.map(String) : [],
        JSON.stringify(schemas),
        body.cover_image_url ? String(body.cover_image_url) : null,
        body.og_image_url ? String(body.og_image_url) : null,
        body.content ? String(body.content) : "",
        body.published === false ? false : true,
        JSON.stringify(faqs),
      ],
    );

    if (!r.rows[0]) return jsonError(res, 404, "Blog post not found");
    res.json(r.rows[0]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update post";
    if (msg.includes("duplicate key") || msg.includes("unique")) return jsonError(res, 409, "Slug already exists");
    return jsonError(res, 500, msg);
  }
});

app.delete("/api/blogs/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const r = await query("delete from public.blog_posts where id = $1 returning id", [id]);
  if (!r.rows[0]) return jsonError(res, 404, "Blog post not found");
  res.json({ ok: true });
});

// PRODUCTS
app.get("/api/products", async (_req, res) => {
  const r = await query("select * from public.products order by created_at desc");
  res.json(r.rows);
});

app.get("/api/products/slug/:slug", async (req, res) => {
  const { slug } = req.params;
  const r = await query("select * from public.products where slug = $1 limit 1", [slug]);
  if (!r.rows[0]) return jsonError(res, 404, "Product not found");
  res.json(r.rows[0]);
});

app.post("/api/products", requireAdmin, async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    if (!body.name || !body.slug) return jsonError(res, 400, "Name and slug are required");

    const faqs = Array.isArray(body.faqs) ? body.faqs : [];

    const r = await query(
      `insert into public.products
        (name, slug, category, summary, description, features, specs, meta_title, meta_description, keywords, cover_image_url, og_image_url, gallery_image_urls, published, faqs, video_url)
       values
        ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16)
       returning *`,
      [
        String(body.name),
        String(body.slug),
        body.category ? String(body.category) : null,
        body.summary ? String(body.summary) : null,
        body.description ? String(body.description) : "",
        Array.isArray(body.features) ? body.features.map(String) : [],
        JSON.stringify(body.specs ?? {}),
        body.meta_title ? String(body.meta_title) : null,
        body.meta_description ? String(body.meta_description) : null,
        Array.isArray(body.keywords) ? body.keywords.map(String) : [],
        body.cover_image_url ? String(body.cover_image_url) : null,
        body.og_image_url ? String(body.og_image_url) : null,
        Array.isArray(body.gallery_image_urls) ? body.gallery_image_urls.map(String) : [],
        body.published === false ? false : true,
        JSON.stringify(faqs),
        body.video_url ? String(body.video_url) : null,
      ],
    );

    res.status(201).json(r.rows[0]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create product";
    if (msg.includes("duplicate key") || msg.includes("unique")) return jsonError(res, 409, "Slug already exists");
    return jsonError(res, 500, msg);
  }
});

app.put("/api/products/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const body = (req.body ?? {}) as Record<string, unknown>;

    const faqs = Array.isArray(body.faqs) ? body.faqs : [];

    const r = await query(
      `update public.products set
          name = $2,
          slug = $3,
          category = $4,
          summary = $5,
          description = $6,
          features = $7,
          specs = $8::jsonb,
          meta_title = $9,
          meta_description = $10,
          keywords = $11,
          cover_image_url = $12,
          og_image_url = $13,
          gallery_image_urls = $14,
          published = $15,
          faqs = $16::jsonb,
          video_url = $17
       where id = $1
       returning *`,
      [
        id,
        String(body.name ?? ""),
        String(body.slug ?? ""),
        body.category ? String(body.category) : null,
        body.summary ? String(body.summary) : null,
        body.description ? String(body.description) : "",
        Array.isArray(body.features) ? body.features.map(String) : [],
        JSON.stringify(body.specs ?? {}),
        body.meta_title ? String(body.meta_title) : null,
        body.meta_description ? String(body.meta_description) : null,
        Array.isArray(body.keywords) ? body.keywords.map(String) : [],
        body.cover_image_url ? String(body.cover_image_url) : null,
        body.og_image_url ? String(body.og_image_url) : null,
        Array.isArray(body.gallery_image_urls) ? body.gallery_image_urls.map(String) : [],
        body.published === false ? false : true,
        JSON.stringify(faqs),
        body.video_url ? String(body.video_url) : null,
      ],
    );

    if (!r.rows[0]) return jsonError(res, 404, "Product not found");
    res.json(r.rows[0]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update product";
    if (msg.includes("duplicate key") || msg.includes("unique")) return jsonError(res, 409, "Slug already exists");
    return jsonError(res, 500, msg);
  }
});

app.delete("/api/products/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const r = await query("delete from public.products where id = $1 returning id", [id]);
  if (!r.rows[0]) return jsonError(res, 404, "Product not found");
  res.json({ ok: true });
});

// UPLOAD (ImgBB)
app.post("/api/uploads/imgbb", requireAdmin, upload.single("image"), async (req, res) => {
  if (!env.imgbbApiKey) return jsonError(res, 500, "IMGBB_API_KEY is not set on the server");
  if (!req.file) return jsonError(res, 400, "No file provided (field name: image)");

  const b64 = req.file.buffer.toString("base64");

  const form = new URLSearchParams();
  form.set("key", env.imgbbApiKey);
  form.set("image", b64);

  const response = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    const text = await response.text();
    return jsonError(res, 502, `ImgBB upload failed: ${text}`);
  }

  const json = (await response.json()) as unknown;
  const url =
    typeof json === "object" && json !== null
      ? (((json as { data?: unknown }).data as { url?: unknown } | undefined)?.url as string | undefined)
      : undefined;
  if (!url) return jsonError(res, 502, "ImgBB response missing image URL");

  res.json({ url });
});

// PAGES
app.get("/api/pages", async (_req, res) => {
  try {
    const r = await query("select content from public.pages order by page_id asc");
    res.json(r.rows.map((row) => row.content));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch pages";
    return jsonError(res, 500, msg);
  }
});

app.put("/api/pages/:pageId", requireAdmin, async (req, res) => {
  try {
    const { pageId } = req.params;
    const body = (req.body ?? {}) as Record<string, unknown>;

    const content = {
      ...body,
      pageId,
    };

    const r = await query(
      `insert into public.pages (page_id, path, name, content)
       values ($1, $2, $3, $4::jsonb)
       on conflict (page_id) do update
         set content    = excluded.content,
             path       = excluded.path,
             name       = excluded.name,
             updated_at = now()
       returning content`,
      [
        pageId,
        typeof body.path === "string" ? body.path : "/",
        typeof body.name === "string" ? body.name : pageId,
        JSON.stringify(content),
      ],
    );

    res.json(r.rows[0]?.content ?? content);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update page";
    return jsonError(res, 500, msg);
  }
});

// Helpers for validating JSON-LD entered as a <script> block
app.post("/api/validate/json", (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const input = body.input;
  if (typeof input !== "string") return jsonError(res, 400, "input must be a string");

  const trimmed = input.trim();
  if (trimmed.startsWith("<script")) {
    const start = trimmed.indexOf(">") + 1;
    const end = trimmed.lastIndexOf("</script>");
    if (start <= 0 || end <= start) return jsonError(res, 400, "Invalid <script> block");
    const inner = trimmed.slice(start, end).trim();
    const parsed = safeJsonParse(inner);
    if (!parsed.ok) return jsonError(res, 400, parsed.error);
    return res.json({ ok: true, json: parsed.value });
  }

  const parsed = safeJsonParse(trimmed);
  if (!parsed.ok) return jsonError(res, 400, parsed.error);
  return res.json({ ok: true, json: parsed.value });
});

// Error handler (Express 5 catches async errors)
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (isPgErrorLike(err) && err.code === "42P01") {
    return res.status(500).json({
      ok: false,
      error:
        "Database schema is not installed (missing tables). Run server/schema.sql in the Supabase SQL editor, then retry.",
      pgCode: err.code,
    });
  }

  const status = (err as any).status || (err as any).statusCode || 500;
  const message = err instanceof Error ? err.message : "Internal server error";
  return res.status(status).json({ ok: false, error: message });
});

export default app;
