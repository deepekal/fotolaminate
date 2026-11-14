import { PRODUCT_LIST_COLUMNS } from "@server/lib/product-columns";
import ProductsPage from "@/screens/Products";
import type { Metadata } from "next";

import { query } from "@server/lib/db";

export const metadata: Metadata = {
  title: "Products",
  description: "Explore Foto Laminate Precision products and machines for photo finishing and lamination.",
  keywords: ["products", "machines", "lamination"],
  alternates: { canonical: "/products" },
};

export default async function Page() {
  let initialProducts: any[] = [];
  try {
    const res = await query(`select ${PRODUCT_LIST_COLUMNS} from public.products where published = true order by created_at desc`);
    initialProducts = res.rows;
  } catch(e) {}
  return <ProductsPage initialProducts={initialProducts} />;
}
