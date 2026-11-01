import BlogsPage from "@/screens/Blogs";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blogs",
  description: "Tips, guides, and updates from Foto Laminate Precision.",
  keywords: ["blogs", "tips", "guides", "updates"],
  alternates: { canonical: "/blogs" },
};

export default function Page() {
  return <BlogsPage />;
}
