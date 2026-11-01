import pg from "pg";
import fs from "fs";
import path from "path";
import { env, requireEnv } from "../lib/env";

function parseLine(line: string) {
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

function normalize(s: string) {
    return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function main() {
  const connectionString = requireEnv(env.supabasePoolerConnectionString, "SUPABASE_POOLER_CONNECTION_STRING");
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const dbProducts = await client.query('select id, name, slug from public.products');
  console.log(`Working with ${dbProducts.rowCount} DB products.`);

  // 1. UPDATE IMAGES FROM ASSETS FOLDER
  const assetsDir = path.join(process.cwd(), 'public', 'assets', 'Assets', 'Products');
  const categories = fs.readdirSync(assetsDir).filter(f => fs.statSync(path.join(assetsDir, f)).isDirectory());

  for (const cat of categories) {
    const catDir = path.join(assetsDir, cat);
    const files = fs.readdirSync(catDir).filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.png'));
    
    // Find matching products
    const normCat = normalize(cat);
    const matches = dbProducts.rows.filter(p => {
        const normP = normalize(p.name);
        return normP.includes(normCat) || normCat.includes(normP);
    });

    if (matches.length > 0) {
        const cover = files.find(f => f.toLowerCase().includes('sub1')) || files[0];
        const gallery = files.filter(f => f !== cover);
        const coverUrl = `/assets/Assets/Products/${cat}/${cover}`;
        const galleryUrls = gallery.map(f => `/assets/Assets/Products/${cat}/${f}`);

        console.log(`Mapping ${matches.length} products to ${cat} folder assets.`);
        for (const p of matches) {
            await client.query(
                'update public.products set cover_image_url = $1, gallery_image_urls = $2 where id = $3',
                [coverUrl, galleryUrls, p.id]
            );
        }
    }
  }

  // 2. UPDATE CONTENT FROM CSV
  const csvContent = fs.readFileSync('all_products_info.csv', 'utf8');
  const csvLines = csvContent.split('\n').filter(l => l.trim());
  let csvUpdated = 0;

  for (let i = 1; i < csvLines.length; i++) {
    const fields = parseLine(csvLines[i]);
    if (fields.length < 6) continue;
    
    const csvName = fields[1];
    const csvDesc = fields[2];
    const csvMeta = fields[5];
    
    const normCsv = normalize(csvName);
    const match = dbProducts.rows.find(p => {
        const normP = normalize(p.name);
        return normP === normCsv || normCsv.includes(normP) || normP.includes(normCsv);
    });

    if (match) {
        const specs: Record<string, string> = {};
        if (csvMeta.includes('product_size:')) {
            const sizeMatch = csvMeta.match(/product_size:\s*([^"\n,]+)/);
            if (sizeMatch) specs['Size'] = sizeMatch[1].trim();
        }

        let summary = '';
        if (csvMeta.includes('rank_math_description:')) {
            const summMatch = csvMeta.match(/rank_math_description:\s*([^"\n]+)/);
            if (summMatch) summary = summMatch[1].trim();
        }

        await client.query(
            `update public.products set 
              description = $1,
              specs = specs || $2::jsonb,
              summary = case when summary = '' or summary is null then $3 else summary end
             where id = $4`,
            [csvDesc, JSON.stringify(specs), summary, match.id]
        );
        csvUpdated++;
    }
  }

  console.log(`Final Report: CSV content matches: ${csvUpdated}. Asset folder mappings applied.`);
  await client.end();
}

main().catch(console.error);
