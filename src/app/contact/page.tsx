import ContactPage from "@/screens/Contact";
import { getPageContent } from "@server/lib/page-data";
import { PageSchemas } from "@/lib/schema-helpers";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageContent("contact");
  return {
    title: page?.seo.title ?? "Contact",
    description: page?.seo.description ?? "Contact Foto Laminate Precision for enquiries, support, and product information.",
    keywords: page?.seo.keywords ?? ["contact", "enquiry", "support"],
    alternates: { canonical: "/contact" },
  };
}

export default async function Page() {
  const page = await getPageContent("contact");
  return (
    <>
      <PageSchemas page={page} />
      <ContactPage />
    </>
  );
}
