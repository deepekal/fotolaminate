import fs from "fs";
import path from "path";

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

const csvPath = path.join(process.cwd(), "all_blogs_data.csv");
const tsPath = path.join(process.cwd(), "src", "content", "blogs.ts");

const csvData = fs.readFileSync(csvPath, "utf-8");
const rows = parseCSV(csvData);

const headers = rows[0];
// Title, Date, Slug, Content

const blogs = [];

for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  if (row.length < 4) continue;
  
  const title = row[0];
  const date = row[1];
  const slug = row[2];
  const content = row[3];
  
  if (!title) continue;

  // Since sections are expected in the old format but new content is just HTML/Text,
  // we can map content to a single section or paragraphs.
  // Actually, wait, let's see what LatestBlogs expects.
  // LatestBlogs uses: staticToRecord(p: typeof blogPosts[0]) which uses p.sections.map(...).
  // So we should structure it as a single section with one big string in paragraphs or split by \n\n.

  const paragraphs = content.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  
  // We need to keep the structure compatible with blogs.ts
  const blog = {
    slug,
    title,
    date: date.split(" ")[0], // YYYY-MM-DD
    readTime: "5 min read", // Placeholder
    excerpt: paragraphs[0] ? paragraphs[0].replace(/<[^>]*>?/gm, '').substring(0, 150) + "..." : "",
    tags: ["News"],
    sections: [
      {
        heading: "",
        paragraphs: paragraphs,
        bullets: []
      }
    ]
  };
  blogs.push(blog);
}

const tsContent = `export type BlogSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  readTime: string;
  excerpt: string;
  tags: string[];
  sections: BlogSection[];
};

export const blogPosts: BlogPost[] = ${JSON.stringify(blogs, null, 2)};
`;

fs.writeFileSync(tsPath, tsContent, "utf-8");
console.log("Successfully generated blogs.ts with " + blogs.length + " posts.");
