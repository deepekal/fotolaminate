const pg = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function main() {
  // Parsing manually to avoid URL issues
  const client = new pg.Client({
    host: "aws-0-us-east-1.pooler.supabase.com",
    port: 5432,
    user: "postgres.nynqgogpmswstskxpsel",
    password: "O5q@y9#T&f2pA-",
    database: "postgres",
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  try {
    const res = await client.query('select name, slug, description, features, specs from public.products limit 3');
    console.log(JSON.stringify(res.rows, null, 2));
  } finally {
    await client.end();
  }
}
main();
