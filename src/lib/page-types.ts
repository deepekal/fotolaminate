export type PageFieldKey = "h1" | "h2" | "h3" | "p" | "image";

export type PageField = {
  key: PageFieldKey;
  label: string;
  value: string;
};

export type PageSection = {
  id: string;
  title: string;
  type?: "standard" | "faq";
  fields?: PageField[];
  faqs?: PageFAQ[];
};

export type PageSEO = {
  title: string;
  description: string;
  keywords: string[];
};

export type PageFAQ = {
  q: string;
  a: string;
};

export type PageContent = {
  pageId: string;
  path: string;
  name: string;
  seo: PageSEO;
  sections: PageSection[];
  // Optional array of structured data JSON-LD objects
  schemas?: unknown[];
  // Optional array of FAQs
  faqs?: PageFAQ[];
};
