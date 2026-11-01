import CataloguePage from "@/screens/Catalogue";
import { getPageContent } from "@server/lib/page-data";
import { PageSchemas } from "@/lib/schema-helpers";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageContent("catalogue");
  return {
    title: page?.seo.title ?? "Catalogue",
    description: page?.seo.description ?? "Download the product catalogue for Foto Laminate Precision.",
    keywords: page?.seo.keywords ?? ["catalogue", "brochure", "products"],
    alternates: { canonical: "/catalogue" },
  };
}

export default async function Page() {
  const page = await getPageContent("catalogue");
  return (
    <>
      <PageSchemas page={page} />
      <CataloguePage />
    </>
  );
}
