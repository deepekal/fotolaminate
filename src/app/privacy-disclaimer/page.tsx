import PrivacyDisclaimerPage from "@/screens/PrivacyDisclaimer";
import { getPageContent } from "@server/lib/page-data";
import { PageSchemas } from "@/lib/schema-helpers";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageContent("privacy-disclaimer");
  return {
    title: page?.seo.title ?? "Privacy & Disclaimer",
    description: page?.seo.description ?? "Read the privacy policy and legal disclaimer for Foto Laminate Precision.",
    keywords: page?.seo.keywords ?? ["privacy policy", "disclaimer", "legal", "terms"],
    alternates: { canonical: "/privacy-disclaimer" },
  };
}

export default async function Page() {
  const page = await getPageContent("privacy-disclaimer");
  return (
    <>
      <PageSchemas page={page} />
      <PrivacyDisclaimerPage />
    </>
  );
}
