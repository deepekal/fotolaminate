import VideosPage from "@/screens/Videos";
import { getPageContent } from "@server/lib/page-data";
import { PageSchemas } from "@/lib/schema-helpers";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageContent("videos");
  return {
    title: page?.seo.title ?? "Videos",
    description: page?.seo.description ?? "Latest videos from Foto Laminate Precision.",
    keywords: page?.seo.keywords ?? ["videos", "youtube", "lamination"],
    alternates: { canonical: "/videos" },
  };
}

export default async function Page() {
  const page = await getPageContent("videos");
  return (
    <>
      <PageSchemas page={page} />
      <VideosPage />
    </>
  );
}
