import pg from "pg";
import { env, requireEnv } from "../lib/env";

async function main() {
  const connectionString = requireEnv(env.supabasePoolerConnectionString, "SUPABASE_POOLER_CONNECTION_STRING");
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  const res = await client.query(
    "select name, cover_image_url, description, specs, features from public.products where name ilike '%Thermal Lamination Machine%'"
  );
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

main().catch(console.error);
