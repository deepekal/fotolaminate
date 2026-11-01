import ExhibitionPhotosPage from "@/screens/ExhibitionPhotos";
import { getPageContent } from "@server/lib/page-data";
import { PageSchemas } from "@/lib/schema-helpers";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageContent("exhibition-photos");
  return {
    title: page?.seo.title ?? "Exhibition Photos",
    description: page?.seo.description ?? "Browse photos from our recent industry exhibitions and trade shows.",
    keywords: page?.seo.keywords ?? ["exhibition", "trade show", "photos", "events"],
    alternates: { canonical: "/exhibition-photos" },
  };
}

export default async function Page() {
  const page = await getPageContent("exhibition-photos");
  return (
    <>
      <PageSchemas page={page} />
      <ExhibitionPhotosPage />
    </>
  );
}
