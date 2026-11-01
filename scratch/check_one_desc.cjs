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
    const res = await client.query("select name, description, specs from public.products where name = 'V Grooving Machine Manual' limit 1");
    console.log(JSON.stringify(res.rows[0], null, 2));
  } finally {
    await client.end();
  }
}
main();
