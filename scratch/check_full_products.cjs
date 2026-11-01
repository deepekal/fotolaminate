const pg = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function main() {
  const client = new pg.Client({
    host: "aws-1-ap-northeast-1.pooler.supabase.com",
    port: 5432,
    user: "postgres.vytibtqgjqnibwqqvkqm",
    password: "Zero10-en+o1",
    database: "postgres",
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  try {
    const res = await client.query("select name, slug, description, cover_image_url from public.products limit 100");
    console.log(res.rows.map(r => ({ name: r.name, hasDesc: !!r.description, hasImg: !!r.cover_image_url })));
  } finally {
    await client.end();
  }
}
main();
