import { PRODUCT_LIST_COLUMNS } from "@server/lib/product-columns";
import ProductCategoryPage from "@/screens/ProductCategory";
import type { Metadata } from "next";
import { query } from "@server/lib/db";
import { slugifyCategory } from "@/lib/slug";
import { compareProductCode } from "@/lib/product-table";

export const runtime = "nodejs";

/** Managed category name for a slug (Dashboard → Categories), falling back to names used on published products. */
async function findCategoryName(categorySlug: string): Promise<string | null> {
  const managed = await query<{ name: string }>("select name from public.product_categories where slug = $1", [categorySlug]);
  if (managed.rows[0]) return managed.rows[0].name;
  const r = await query<{ category: string | null }>("select distinct category from public.products where published = true");
  return r.rows.map((row) => row.category).find((c): c is string => !!c && slugifyCategory(c) === categorySlug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}): Promise<Metadata> {
  const { categorySlug } = await params;

  try {
    const category = await findCategoryName(categorySlug);

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
    const managedName = await findCategoryName(categorySlug);
    const matched = published.filter(
      (p) =>
        p.category &&
        (slugifyCategory(p.category) === categorySlug ||
          (managedName !== null && p.category.trim().toLowerCase() === managedName.toLowerCase()))
    );
    initialProducts = matched.sort(compareProductCode);
    categoryName = managedName ?? matched[0]?.category ?? "";
  } catch {}

  return (
    <ProductCategoryPage
      categorySlugProp={categorySlug}
      initialProducts={initialProducts}
      initialCategoryName={categoryName}
    />
  );
}
