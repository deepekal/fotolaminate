import CertificatesPage from "@/screens/Certificates";
import { getPageContent } from "@server/lib/page-data";
import { PageSchemas } from "@/lib/schema-helpers";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageContent("certificates");
  return {
    title: page?.seo.title ?? "Certificates",
    description: page?.seo.description ?? "View the quality certifications and industry compliance documents for Foto Laminate Precision.",
    keywords: page?.seo.keywords ?? ["certificates", "ISO", "quality assurance"],
    alternates: { canonical: "/certificates" },
  };
}

export default async function Page() {
  const page = await getPageContent("certificates");
  return (
    <>
      <PageSchemas page={page} />
      <CertificatesPage />
    </>
  );
}
