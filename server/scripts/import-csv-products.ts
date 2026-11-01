import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { env, requireEnv } from "../lib/env";

function parseCsvLine(line: string) {
  const fields: string[] = [];
  let current = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuote && line[i+1] === '"') {
        current += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (c === ',' && !inQuote) {
      fields.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  fields.push(current);
  return fields;
}

// Special multiline CSV parser
function parseMultilineCsv(text: string) {
  const rows: string[][] = [];
  let currentFields: string[] = [];
  let inQuote = false;
  let currentField = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i+1];

    if (char === '"') {
      if (inQuote && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (char === ',' && !inQuote) {
      currentFields.push(currentField);
      currentField = '';
    } else if (char === '\n' && !inQuote) {
      currentFields.push(currentField);
      if (currentFields.length >= 2) {
         rows.push(currentFields);
      }
      currentFields = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  return rows;
}

async function main() {
  const connectionString = requireEnv(env.supabasePoolerConnectionString, "SUPABASE_POOLER_CONNECTION_STRING");
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Connected to database");

  const csvPath = path.resolve(process.cwd(), "all_products_info.csv");
  const content = fs.readFileSync(csvPath, "utf8");
  const rows = parseMultilineCsv(content);

  console.log(`Processing ${rows.length - 1} products...`);

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 3) continue;

    const name = row[1];
    let description = row[2];
    const meta = row[5] || "";

    if (!name) continue;

    // Clean description (remove &amp; etc)
    description = description.replace(/&amp;/g, '&').replace(/&quot;/g, '"');

    // Extract features if they are in description asbullets or sentences
    const features: string[] = [];
    if (description.includes("•")) {
        description.split("•").slice(1).forEach(f => features.push(f.trim()));
    } else if (description.includes(". ")) {
        // Just take the middle sentences as features if it's very long
        const sentences = description.split(". ");
        if (sentences.length > 3) {
            sentences.slice(1, -1).forEach(s => {
                if (s.length > 10 && s.length < 150) features.push(s.trim());
            });
        }
    }

    // Extract specs from meta
    const specs: Record<string, string> = {};
    if (meta.includes("product_size:")) {
        const sizePart = meta.split("product_size:")[1].split("\n")[0].trim().replace(/^"/, '').replace(/"$/, '');
        if (sizePart) specs["Size"] = sizePart;
    }

    // Update the product in the DB with more aggressive matching
    const cleanName = name.replace(/\s+/g, '').toLowerCase();
    
    // Try exact match first, then clean match (removing spaces), then partial match
    const res = await client.query(
      `UPDATE public.products 
       SET description = $1, features = $2, specs = $3
       WHERE LOWER(name) = LOWER($4) 
          OR REPLACE(LOWER(name), ' ', '') = $5
          OR LOWER(name) LIKE '%' || LOWER($4) || '%'
          OR LOWER($4) LIKE '%' || LOWER(name) || '%'`,
      [description, features, specs, name, cleanName]
    );

    if ((res.rowCount ?? 0) > 0) {
      console.log(`Updated ${name}`);
    } else {
      // If not found, maybe insert? But user only said they were missing details.
      // We assume they exist from the earlier image import.
      console.log(`Product not found in DB: ${name}`);
    }
  }

  await client.end();
  console.log("Import complete");
}

main().catch(console.error);
