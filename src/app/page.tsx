import Index from "@/screens/Index";
import { getPageContent } from "@server/lib/page-data";
import { PageSchemas } from "@/lib/schema-helpers";
import { query } from "../../server/lib/db";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageContent("home");
  return {
    title: page?.seo.title ?? "Home",
    description:
      page?.seo.description ?? "Industrial photo lamination machines and finishing solutions by Foto Laminate Precision.",
    keywords: page?.seo.keywords ?? ["home", "photo lamination", "industrial machines"],
    alternates: { canonical: "/" },
  };
}

export default async function Page() {
  const page = await getPageContent("home");
  let initialProducts: any[] = [];
  try {
    const res = await query(`select * from public.products where published = true order by created_at desc`);
    initialProducts = res.rows;
  } catch(e) {}
  return (
    <>
      <PageSchemas page={page} />
      <Index page={page} initialProducts={initialProducts} />
    </>
  );
}
