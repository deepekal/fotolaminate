import AwardsPage from "@/screens/Awards";
import { getPageContent } from "@server/lib/page-data";
import { PageSchemas } from "@/lib/schema-helpers";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageContent("awards");
  return {
    title: page?.seo.title ?? "Awards & Recognitions",
    description: page?.seo.description ?? "View the awards and recognitions earned by Foto Laminate Precision for our excellence in manufacturing.",
    keywords: page?.seo.keywords ?? ["awards", "recognition", "achievements"],
    alternates: { canonical: "/awards" },
  };
}

export default async function Page() {
  const page = await getPageContent("awards");
  return (
    <>
      <PageSchemas page={page} />
      <AwardsPage />
    </>
  );
}
