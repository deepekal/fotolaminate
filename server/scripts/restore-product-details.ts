import pg from "pg";
import fs from "fs";
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
    return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function main() {
  const connectionString = requireEnv(env.supabasePoolerConnectionString, "SUPABASE_POOLER_CONNECTION_STRING");
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const csvContent = fs.readFileSync('all_products_info.csv', 'utf8');
  const csvLines = csvContent.split('\n').filter(l => l.trim());
  
  const dbProducts = await client.query('select id, name, slug from public.products');
  
  let updatedCount = 0;

  for (let i = 1; i < csvLines.length; i++) {
      const fields = parseLine(csvLines[i]);
      if (fields.length < 6) continue;
      
      const csvName = fields[1];
      const csvDesc = fields[2];
      const csvMeta = fields[5];
      
      // Fuzzy match
      const normCsv = normalize(csvName);
      const match = dbProducts.rows.find(p => normalize(p.name) === normCsv || normCsv.includes(normalize(p.name)) || normalize(p.name).includes(normCsv));
      
      if (match) {
          console.log(`Updating ${match.name} from CSV matches "${csvName}"`);
          
          const specs: Record<string, string> = {};
          if (csvMeta.includes('product_size:')) {
              const sizeMatch = csvMeta.match(/product_size:\s*([^"\n,]+)/);
              if (sizeMatch) specs['Size'] = sizeMatch[1].trim();
          }

          // Extract rank math description for summary
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
          updatedCount++;
      }
  }

  console.log(`Done! Updated ${updatedCount} products.`);
  await client.end();
}

main().catch(console.error);
