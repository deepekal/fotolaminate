import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import ProductCategories from "@/components/ProductCategories";
import type { PageContent, PageSection } from "@/lib/page-types";

const FeaturedProducts = dynamic(() => import("@/components/FeaturedProducts"));
const LatestBlogs = dynamic(() => import("@/components/LatestBlogs"));
const WhyChooseUs = dynamic(() => import("@/components/WhyChooseUs"));
const Applications = dynamic(() => import("@/components/Applications"));
const Manufacturing = dynamic(() => import("@/components/Manufacturing"));
const GrowingCompany = dynamic(() => import("@/components/GrowingCompany"));
const LatestVideos = dynamic(() => import("@/components/LatestVideos"));
const Testimonials = dynamic(() => import("@/components/Testimonials"));
const FAQSection = dynamic(() => import("@/components/FAQSection"));
const Contact = dynamic(() => import("@/components/Contact"));
const Footer = dynamic(() => import("@/components/Footer"));
const CatalogueSection = dynamic(() => import("@/components/CatalogueSection"));
const QualityClients = dynamic(() => import("@/components/QualityClients"));
const QualityAssuranceDetails = dynamic(() => import("@/components/QualityAssuranceDetails"));

type IndexProps = {
  page?: PageContent | null;
  initialProducts?: any[];
};

function getSection(page: PageContent | null | undefined, sectionId: string): PageSection | null {
  return page?.sections.find((section) => section.id === sectionId) ?? null;
}

function getFieldValue(section: PageSection | null, key: string): string | undefined {
  return (section?.fields ?? []).find((field) => field.key === key)?.value;
}

function getFieldValues(section: PageSection | null, key: string): string[] {
  return (section?.fields ?? []).filter((field) => field.key === key).map((field) => field.value);
}

function getCardItems(section: PageSection | null): { title: string; desc: string }[] {
  if (!section) return [];
  const titles = getFieldValues(section, "h3");
  const descriptions = getFieldValues(section, "p");
  return titles.map((title, index) => ({
    title,
    desc: descriptions[index] ?? "",
  }));
}

function getStatItems(section: PageSection | null): { value: string; label: string }[] {
  if (!section) return [];
  const values = getFieldValues(section, "h2");
  const allParagraphs = getFieldValues(section, "p");
  // The first paragraph is the section summary, stats labels start from index 1
  const labels = allParagraphs.slice(1);
  return values.map((value, index) => ({
    value,
    label: labels[index] ?? "",
  }));
}

const Index = ({ page, initialProducts }: IndexProps) => {
  const heroSection = getSection(page, "hero");
  const aboutSection = getSection(page, "about");
  const whyUsSection = getSection(page, "why-us");
  const applicationsSection = getSection(page, "applications");
  const manufacturingSection = getSection(page, "manufacturing");
  const growingSection = getSection(page, "growing-company");
  const qualityClientsSection = getSection(page, "quality-clients");
  const qualityAssuranceSection = getSection(page, "quality-assurance");
  const catalogueSection = getSection(page, "catalogue-section");
  const contactSection = getSection(page, "contact");

  const aboutParagraphs = getFieldValues(aboutSection, "p");

  return (
    <>
      <Navbar />
      <Hero
        title={getFieldValue(heroSection, "h1")}
        description={getFieldValue(heroSection, "p")}
      />
      <About
        title={getFieldValue(aboutSection, "h2")}
        paragraph1={aboutParagraphs[0] || undefined}
        paragraph2={aboutParagraphs[1] || undefined}
      />
      <ProductCategories useDb initialDbProducts={initialProducts} />
      <FeaturedProducts enquireHref="/#contact" />
      <WhyChooseUs title={getFieldValue(whyUsSection, "h2")} reasons={getCardItems(whyUsSection)} />
      <Applications title={getFieldValue(applicationsSection, "h2")} applications={getCardItems(applicationsSection)} />
      <Manufacturing
        title={getFieldValue(manufacturingSection, "h2")}
        description={getFieldValue(manufacturingSection, "p")}
        steps={getFieldValues(manufacturingSection, "h3")}
      />
      <GrowingCompany
        title={getFieldValue(growingSection, "h1")}
        description={getFieldValue(growingSection, "p")}
        stats={getStatItems(growingSection)}
      />
      <QualityClients
        qualityTitle={getFieldValue(qualityClientsSection, "h2")}
        qualityDescription={getFieldValue(qualityClientsSection, "p")}
      />
      <QualityAssuranceDetails
        title={getFieldValue(qualityAssuranceSection, "h2")}
        description={getFieldValue(qualityAssuranceSection, "p")}
        items={getFieldValues(qualityAssuranceSection, "h3")}
      />
      <CatalogueSection
        heading={getFieldValue(catalogueSection, "h2")}
        body={getFieldValue(catalogueSection, "p")}
      />
      <LatestVideos viewAllHref="/videos" viewAllLabel="View all videos" />
      <LatestBlogs />
      <Testimonials />
      {/* Home page FAQ — prefer a dedicated 'faq' section if configured, otherwise use page-level faqs */}
      <FAQSection
        faqs={
          page?.sections.find((section) => section.type === "faq" || section.id === "faq")?.faqs ??
          page?.faqs
        }
      />
      <Contact
        title={getFieldValue(contactSection, "h1")}
        description={getFieldValue(contactSection, "p")}
      />
      <Footer />
    </>
  );
};

export default Index;
