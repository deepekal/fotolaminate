import { PRODUCT_LIST_COLUMNS } from "@server/lib/product-columns";
import ProductCategoryPage from "@/screens/ProductCategory";
import type { Metadata } from "next";
import { query } from "@server/lib/db";
import { slugifyCategory } from "@/lib/slug";

export const runtime = "nodejs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}): Promise<Metadata> {
  const { categorySlug } = await params;

  try {
    const r = await query<{ category: string | null }>(
      "select distinct category from public.products where published = true"
    );

    const categories = r.rows.map((row) => row.category).filter((c): c is string => !!c);
    const category = categories.find((c) => slugifyCategory(c) === categorySlug) || null;

    if (!category) {
      return {
        title: "Category Not Found",
        robots: { index: false, follow: false },
        alternates: { canonical: `/products/category/${categorySlug}` },
      };
    }

    const title = `${category} Lamination Machines | Foto Laminate Precision`;
    const description = `Discover and enquire about the best ${category} lamination machines and finishing solutions manufactured by Foto Laminate Precision.`;

    return {
      title,
      description,
      alternates: {
        canonical: `/products/category/${categorySlug}`,
      },
      openGraph: {
        title,
        description,
        url: `/products/category/${categorySlug}`,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch {
    return {
      title: "Product Category",
      alternates: {
        canonical: `/products/category/${categorySlug}`,
      },
    };
  }
}

import type { ProductRecord } from "@/lib/api";

export default async function Page({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
  let initialProducts: ProductRecord[] = [];
  let categoryName = "";

  try {
    const res = await query<ProductRecord>(
      `select ${PRODUCT_LIST_COLUMNS} from public.products where published = true order by created_at desc`
    );
    const published = res.rows;
    const matched = published.filter(
      (p) => p.category && slugifyCategory(p.category) === categorySlug
    );
    initialProducts = matched;
    if (matched.length > 0 && matched[0].category) {
      categoryName = matched[0].category;
    }
  } catch {}

  return (
    <ProductCategoryPage
      categorySlugProp={categorySlug}
      initialProducts={initialProducts}
      initialCategoryName={categoryName}
    />
  );
}
