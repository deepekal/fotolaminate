import pg from "pg";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { env, requireEnv } from "../lib/env";

const BASE = "https://fotolaminate.com";
const INDEX_URL = `${BASE}/products/`;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function slugify(input: string) {
  return normalizeWhitespace(input)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
}

function firstSentence(text: string, maxLen: number) {
  const clean = normalizeWhitespace(text);
  if (!clean) return "";
  const idx = clean.search(/[.!?]\s/);
  const sentence = idx >= 0 ? clean.slice(0, idx + 1) : clean;
  return sentence.length > maxLen ? sentence.slice(0, maxLen).trimEnd() : sentence;
}

function toAbsUrl(url: string, base: string) {
  try {
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}

async function fetchHtml(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "foto-laminate-precision-importer/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  return await res.text();
}

type ExtractedProduct = {
  name: string;
  slug: string;
  category: string | null;
  summary: string | null;
  description: string;
  features: string[];
  specs: Record<string, string>;
  coverImageUrl: string | null;
  galleryUrls: string[];
  sourceUrl: string;
};

function extractCategoryTitle($: cheerio.CheerioAPI, fallbackSlug: string) {
  const h1 = normalizeWhitespace($("h1").first().text());
  if (h1) return h1;

  const title = normalizeWhitespace($("title").text());
  if (title) return title.replace(/\s*\|\s*.*$/, "");

  return fallbackSlug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function parseSpecsFromTable($table: cheerio.Cheerio<AnyNode>, $: cheerio.CheerioAPI) {
  const specs: Record<string, string> = {};
  $table
    .find("tr")
    .toArray()
    .forEach((tr) => {
      const cells = $(tr).find("th,td").toArray();
      if (cells.length < 2) return;
      const key = normalizeWhitespace($(cells[0]).text());
      const val = normalizeWhitespace($(cells[1]).text());
      if (!key || !val) return;
      specs[key] = val;
    });
  return specs;
}

function extractTextExcluding($node: cheerio.Cheerio<AnyNode>, $: cheerio.CheerioAPI) {
  // Avoid mutating the live DOM and avoid relying on clone() availability.
  const html = $.html($node);
  if (!html) return "";
  const $$ = cheerio.load(html);
  $$("table, li, script, style").remove();
  return normalizeWhitespace($$.root().text());
}

function extractModelsFromCategoryPage(html: string, categoryUrl: string) {
  const $ = cheerio.load(html);
  const categorySlug = new URL(categoryUrl).pathname.split("/").filter(Boolean).slice(-1)[0] ?? "products";
  const categoryTitle = extractCategoryTitle($, categorySlug);

  const modelHeadings = $("h6").toArray();

  const products: ExtractedProduct[] = [];

  for (const h of modelHeadings) {
    const name = normalizeWhitespace($(h).text());
    if (!name) continue;

    let cursor = $(h).next();
    let table: cheerio.Cheerio<AnyNode> | null = null;

    while (cursor.length) {
      const tag = (cursor.get(0)?.tagName ?? "").toLowerCase();
      if (tag === "h6") break;

      const tableInNode = cursor.is("table") ? cursor : cursor.find("table").first();
      if (!table && tableInNode.length) {
        table = tableInNode as unknown as cheerio.Cheerio<AnyNode>;
        break;
      }

      cursor = cursor.next();
    }

    if (!table) continue;

    const specs = parseSpecsFromTable(table, $);
    if (Object.keys(specs).length === 0) continue;

    // Collect content between heading and next heading
    const sectionNodes: cheerio.Cheerio<AnyNode>[] = [];
    cursor = $(h).next();
    while (cursor.length) {
      const tag = (cursor.get(0)?.tagName ?? "").toLowerCase();
      if (tag === "h6") break;
      sectionNodes.push(cursor as unknown as cheerio.Cheerio<AnyNode>);
      cursor = cursor.next();
    }

    const images: string[] = [];
    const features: string[] = [];
    const descriptionParts: string[] = [];
    for (const node of sectionNodes) {
      node
        .find("img")
        .toArray()
        .forEach((img) => {
          const src = $(img).attr("src");
          if (src) images.push(toAbsUrl(src, categoryUrl));
        });

      node
        .find("li")
        .toArray()
        .forEach((li) => {
          const t = normalizeWhitespace($(li).text());
          if (t) features.push(t);
        });

      const sectionText = extractTextExcluding(node, $);
      if (sectionText && sectionText.toLowerCase() !== name.toLowerCase()) {
        descriptionParts.push(sectionText);
      }
    }

    const description = normalizeWhitespace(descriptionParts.join("\n\n"));
    const summary = description ? firstSentence(description, 160) : null;

    const modelSlug = slugify(name);
    const slug = `${categorySlug}-${modelSlug}`;

    const galleryUrls = Array.from(new Set(images)).slice(0, 12);
    const coverImageUrl = galleryUrls[0] ?? null;

    products.push({
      name,
      slug,
      category: categoryTitle || null,
      summary,
      description: description || name,
      features: Array.from(new Set(features)).slice(0, 12),
      specs,
      coverImageUrl,
      galleryUrls,
      sourceUrl: categoryUrl,
    });
  }

  return { categorySlug, categoryTitle, products };
}

async function getCategoryUrls() {
  const html = await fetchHtml(INDEX_URL);
  const $ = cheerio.load(html);

  const urls = $("a")
    .toArray()
    .map((a) => $(a).attr("href") ?? "")
    .map((href) => href.trim())
    .filter(Boolean)
    .filter((href) => href !== "../")
    .map((href) => toAbsUrl(href, INDEX_URL))
    .filter((u) => u.startsWith(INDEX_URL));

  const unique = Array.from(new Set(urls))
    .filter((u) => u.endsWith("/"))
    .filter((u) => !u.includes("/products/?"))
    .filter((u) => !u.endsWith("-menu/"));

  unique.sort();
  return unique;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) : undefined;
  const delayIdx = args.indexOf("--delay");
  const delayMs = delayIdx >= 0 ? Number(args[delayIdx + 1]) : 150;
  return { dryRun, limit, delayMs };
}

async function upsertProducts(client: pg.Client, products: ExtractedProduct[]) {
  for (const p of products) {
    await client.query(
      `insert into public.products
        (name, slug, category, summary, description, features, specs, cover_image_url, og_image_url, gallery_image_urls, published)
       values
        ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11)
       on conflict (slug) do update set
        name = excluded.name,
        category = excluded.category,
        summary = excluded.summary,
        description = excluded.description,
        features = excluded.features,
        specs = excluded.specs,
        cover_image_url = excluded.cover_image_url,
        og_image_url = excluded.og_image_url,
        gallery_image_urls = excluded.gallery_image_urls,
        published = excluded.published`,
      [
        p.name,
        p.slug,
        p.category,
        p.summary,
        p.description,
        p.features,
        JSON.stringify(p.specs),
        p.coverImageUrl,
        p.coverImageUrl,
        p.galleryUrls,
        true,
      ],
    );
  }
}

async function main() {
  const { dryRun, limit, delayMs } = parseArgs();

  const connectionString = requireEnv(env.supabasePoolerConnectionString, "SUPABASE_POOLER_CONNECTION_STRING");

  const categoryUrls = await getCategoryUrls();
  const selected = typeof limit === "number" && Number.isFinite(limit) ? categoryUrls.slice(0, limit) : categoryUrls;

  process.stdout.write(`Found ${categoryUrls.length} category URLs. Importing ${selected.length}.\n`);

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  if (!dryRun) await client.connect();

  let totalProducts = 0;

  try {
    for (let i = 0; i < selected.length; i++) {
      const url = selected[i];
      process.stdout.write(`[${i + 1}/${selected.length}] Fetch ${url} ... `);
      const html = await fetchHtml(url);
      const { products, categoryTitle } = extractModelsFromCategoryPage(html, url);

      process.stdout.write(`extracted ${products.length} models (${categoryTitle}).\n`);

      totalProducts += products.length;

      if (!dryRun && products.length) {
        await upsertProducts(client, products);
      }

      await sleep(delayMs);
    }

    if (!dryRun) {
      const counts = await client.query(
        "select (select count(*)::int from public.products) as products",
      );
      process.stdout.write(`Import complete. Total extracted: ${totalProducts}. DB products: ${counts.rows[0]?.products ?? 0}.\n`);
    } else {
      process.stdout.write(`Dry run complete. Total extracted: ${totalProducts}.\n`);
    }
  } finally {
    if (!dryRun) await client.end();
  }
}

main().catch((err) => {
  const message = err instanceof Error ? err.stack ?? err.message : String(err);
  process.stderr.write(message + "\n");
  process.exit(1);
});
