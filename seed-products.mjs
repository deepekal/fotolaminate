/**
 * Product seed script
 * Run with: node seed-products.mjs
 *
 * Reads all_products_info.csv and upserts every product into the Supabase
 * products table, filling in description, meta_title, meta_description, and
 * keywords from the CSV's "All Meta Data" column.
 */

import fs from "fs";
import path from "path";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env") });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-");
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

/**
 * Very simple CSV parser that handles quoted fields with embedded commas
 * and newlines. Returns an array of rows, each row being an array of strings.
 */
function parseCSV(text) {
  const result = [];
  let currentLine = [];
  let currentValue = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentValue += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      currentLine.push(currentValue);
      currentValue = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      currentLine.push(currentValue);
      result.push(currentLine);
      currentLine = [];
      currentValue = "";
    } else {
      currentValue += char;
    }
  }

  if (currentValue !== "" || currentLine.length > 0) {
    currentLine.push(currentValue);
    result.push(currentLine);
  }

  return result;
}

/**
 * Parse the messy "All Meta Data" cell which contains newline-separated
 * key: value pairs exported from WordPress/RankMath.
 */
function parseMetaData(raw) {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const meta = {};
  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    meta[key] = decodeHtmlEntities(value);
  }
  return meta;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const connectionString = process.env.SUPABASE_POOLER_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error("No SUPABASE_POOLER_CONNECTION_STRING found in .env");
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("✅ Connected to database");

  try {
    const csvPath = path.join(process.cwd(), "all_products_info.csv");
    const csvText = fs.readFileSync(csvPath, "utf-8");
    const rows = parseCSV(csvText);

    if (rows.length < 2) {
      console.log("No data rows found in CSV.");
      return;
    }

    // Header row: "ID","Name","Description","Specifications","Features","All Meta Data"
    const header = rows[0].map((h) => h.trim().toLowerCase());
    const idIdx   = header.indexOf("id");
    const nameIdx = header.indexOf("name");
    const descIdx = header.indexOf("description");
    const specsIdx = header.indexOf("specifications");
    const featIdx = header.indexOf("features");
    const metaIdx = header.indexOf("all meta data");

    console.log(`📋 CSV columns: ${header.join(", ")}`);
    console.log(`📊 Total rows (including header): ${rows.length}`);

    let upserted = 0;
    let skipped = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 2) { skipped++; continue; }

      const name = row[nameIdx]?.trim();
      if (!name) { skipped++; continue; }

      const rawDescription = row[descIdx]?.trim() ?? "";
      const rawSpecs       = row[specsIdx]?.trim() ?? "";
      const rawFeatures    = row[featIdx]?.trim() ?? "";
      const rawMeta        = row[metaIdx]?.trim() ?? "";

      const description = decodeHtmlEntities(rawDescription);
      const slug = slugify(name);

      // Parse meta fields from the "All Meta Data" column
      const meta = parseMetaData(rawMeta);
      const metaTitle       = meta["rank_math_title"]       || `${name} | Fotolaminate`;
      const metaDescription = meta["rank_math_description"] || description.slice(0, 160) || null;
      const focusKeyword    = meta["rank_math_focus_keyword"] || name;
      const keywords        = focusKeyword ? [focusKeyword] : [];

      // Parse features — may be a comma or newline separated list in the CSV
      const featuresList = rawFeatures
        ? rawFeatures.split(/[,\n]/).map((f) => decodeHtmlEntities(f.trim())).filter(Boolean)
        : [];

      // Try to parse specs as JSON, or store as a simple object
      let specsObj = {};
      if (rawSpecs) {
        try {
          specsObj = JSON.parse(rawSpecs);
        } catch {
          // Store as plain text description if it's not JSON
          if (rawSpecs.trim()) specsObj = { details: decodeHtmlEntities(rawSpecs) };
        }
      }

      try {
        await client.query(
          `INSERT INTO public.products
             (name, slug, description, features, specs,
              meta_title, meta_description, keywords, published)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9)
           ON CONFLICT (slug) DO UPDATE SET
             name             = EXCLUDED.name,
             description      = EXCLUDED.description,
             features         = EXCLUDED.features,
             specs            = EXCLUDED.specs,
             meta_title       = EXCLUDED.meta_title,
             meta_description = EXCLUDED.meta_description,
             keywords         = EXCLUDED.keywords,
             updated_at       = now()`,
          [
            name,
            slug,
            description,
            featuresList,
            JSON.stringify(specsObj),
            metaTitle,
            metaDescription,
            keywords,
            true,
          ]
        );
        console.log(`  ✅ Upserted: ${name} (slug: ${slug})`);
        upserted++;
      } catch (err) {
        console.error(`  ❌ Failed: ${name} — ${err.message}`);
        skipped++;
      }
    }

    console.log(`\n🎉 Done! ${upserted} products upserted, ${skipped} skipped.`);
  } finally {
    await client.end();
    console.log("🔌 Disconnected.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
