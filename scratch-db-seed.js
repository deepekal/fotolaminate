import fs from "fs";
import path from "path";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env") });

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
    } else if (char === ',' && !insideQuotes) {
      currentLine.push(currentValue);
      currentValue = "";
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
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

  try {
    const csvPath = path.join(process.cwd(), "all_blogs_data.csv");
    const csvData = fs.readFileSync(csvPath, "utf-8");
    const rows = parseCSV(csvData);

    const blogs = [];

    // Skip header
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 4) continue;
      
      const title = row[0]?.trim();
      const date = row[1]?.trim();
      const slug = row[2]?.trim();
      const content = row[3]?.trim();
      
      if (!title || !slug) continue;

      const paragraphs = content.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
      const excerpt = paragraphs[0] ? paragraphs[0].replace(/<[^>]*>?/gm, '').substring(0, 150) + "..." : "";

      blogs.push({
        title,
        slug,
        meta_title: title,
        meta_description: excerpt,
        tags: ["News"],
        keywords: [],
        schemas: [],
        cover_image_url: null,
        og_image_url: null,
        content: content,
        published: true,
        created_at: date || new Date().toISOString(),
        updated_at: date || new Date().toISOString()
      });
    }

    console.log(`Found ${blogs.length} blogs in CSV.`);

    // Clear existing blogs
    await client.query("DELETE FROM public.blog_posts");
    console.log("Cleared existing pseudo blog posts.");

    // Insert new blogs
    for (const blog of blogs) {
      await client.query(
        `INSERT INTO public.blog_posts 
          (title, slug, meta_title, meta_description, tags, keywords, schemas, cover_image_url, og_image_url, content, published, created_at, updated_at) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          blog.title,
          blog.slug,
          blog.meta_title,
          blog.meta_description,
          blog.tags,
          blog.keywords,
          JSON.stringify(blog.schemas),
          blog.cover_image_url,
          blog.og_image_url,
          blog.content,
          blog.published,
          blog.created_at,
          blog.updated_at
        ]
      );
    }
    
    console.log("Successfully seeded database with actual blogs.");
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
