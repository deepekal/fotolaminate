// Columns needed by product cards and listings. Full rows (description, FAQs,
// specs…) are large, so only the product page and the admin load them.
export const PRODUCT_LIST_COLUMNS =
  "id, name, slug, category, summary, features, cover_image_url, published, created_at, updated_at";
