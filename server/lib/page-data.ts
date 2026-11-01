import fs from "fs/promises";
import path from "path";
import { query } from "@server/lib/db";
import { env } from "@server/lib/env";
import type { PageContent } from "@/lib/page-types";

const pagesFile = path.join(process.cwd(), "content", "pages.json");
const isDbEnabled = Boolean(env.supabasePoolerConnectionString);

async function readPageContentListFromFile(): Promise<PageContent[]> {
  const raw = await fs.readFile(pagesFile, "utf-8");
  return JSON.parse(raw) as PageContent[];
}

async function writePageContentListToFile(pages: PageContent[]) {
  await fs.writeFile(pagesFile, JSON.stringify(pages, null, 2) + "\n", "utf-8");
}

async function readPageContentListFromDb(): Promise<PageContent[]> {
  const result = await query<{ content: PageContent }>(
    "select content from public.pages order by page_id asc",
  );
  return result.rows.map((row) => row.content);
}

async function writePageContentListToDb(pages: PageContent[]) {
  await Promise.all(
    pages.map((page) =>
      query(
        `insert into public.pages (page_id, path, name, content)
         values ($1, $2, $3, $4::jsonb)
         on conflict (page_id) do update
         set content = excluded.content,
             path = excluded.path,
             name = excluded.name,
             updated_at = now()`,
        [page.pageId, page.path, page.name, JSON.stringify(page)],
      ),
    ),
  );
}

export async function readPageContentList(): Promise<PageContent[]> {
  if (isDbEnabled) {
    try {
      const pages = await readPageContentListFromDb();
      if (pages.length > 0) return pages;
    } catch (error) {
      console.warn("Failed to read page data from DB, falling back to content/pages.json", error);
    }
  }
  return readPageContentListFromFile();
}

export async function writePageContentList(pages: PageContent[]) {
  if (isDbEnabled) {
    try {
      return await writePageContentListToDb(pages);
    } catch (error) {
      console.warn("Failed to write page data to DB, falling back to content/pages.json", error);
    }
  }
  return writePageContentListToFile(pages);
}

export async function getPageContent(pageId: string): Promise<PageContent | null> {
  if (isDbEnabled) {
    try {
      const result = await query<{ content: PageContent }>(
        "select content from public.pages where page_id = $1",
        [pageId],
      );
      if (result.rows[0]?.content) return result.rows[0].content;
    } catch (error) {
      console.warn("Failed to read page content from DB, falling back to content/pages.json", error);
    }
  }

  const pages = await readPageContentListFromFile();
  return pages.find((page) => page.pageId === pageId) ?? null;
}
