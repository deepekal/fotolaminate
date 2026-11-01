import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { env, requireEnv } from "../lib/env";

function readSql(filePath: string) {
  return fs.readFileSync(filePath, "utf8");
}

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

const runSchema = hasFlag("--schema") || hasFlag("--all") || (!hasFlag("--seed") && !hasFlag("--schema"));
const runSeed = hasFlag("--seed") || hasFlag("--all") || (!hasFlag("--seed") && !hasFlag("--schema"));

async function main() {
  const connectionString = requireEnv(env.supabasePoolerConnectionString, "SUPABASE_POOLER_CONNECTION_STRING");

  const root = path.resolve(process.cwd());
  const schemaPath = path.join(root, "server", "schema.sql");
  const seedPath = path.join(root, "server", "seed.sql");

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    if (runSchema) {
      const schemaSql = readSql(schemaPath);
      await client.query(schemaSql);
      process.stdout.write("Schema applied\n");
    }

    if (runSeed) {
      const seedSql = readSql(seedPath);
      await client.query(seedSql);
      process.stdout.write("Seed applied\n");
    }

    const tables = await client.query(
      "select to_regclass('public.blog_posts') as blog_posts, to_regclass('public.products') as products",
    );
    process.stdout.write(
      `Tables: blog_posts=${tables.rows[0]?.blog_posts ?? null}, products=${tables.rows[0]?.products ?? null}\n`,
    );

    const counts = await client.query(
      "select (select count(*)::int from public.blog_posts) as blog_posts, (select count(*)::int from public.products) as products",
    );
    process.stdout.write(
      `Counts: blog_posts=${counts.rows[0]?.blog_posts ?? 0}, products=${counts.rows[0]?.products ?? 0}\n`,
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(message + "\n");
  process.exit(1);
});
