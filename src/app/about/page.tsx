import AboutPage from "@/screens/About";
import { getPageContent } from "@server/lib/page-data";
import { PageSchemas } from "@/lib/schema-helpers";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageContent("about");
  return {
    title: page?.seo.title ?? "About",
    description: page?.seo.description ?? "Learn about Foto Laminate Precision, our manufacturing expertise, and our commitment to quality.",
    keywords: page?.seo.keywords ?? ["about", "manufacturer", "lamination machines"],
    alternates: { canonical: "/about" },
  };
}

export default async function Page() {
  const page = await getPageContent("about");
  return (
    <>
      <PageSchemas page={page} />
      <AboutPage />
    </>
  );
}
