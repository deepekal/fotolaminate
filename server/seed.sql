-- Seed data for Foto Laminate Precision
-- Safe to run multiple times (uses ON CONFLICT DO NOTHING on unique slugs).

-- BLOG POSTS
insert into public.blog_posts
  (title, slug, meta_title, meta_description, tags, keywords, schemas, cover_image_url, og_image_url, content, published)
values
  (
    'Welcome to Foto Laminate Precision',
    'welcome-to-foto-laminate-precision',
    'Welcome | Foto Laminate Precision',
    'An introduction to Foto Laminate Precision and our photo lamination solutions.',
    array['company', 'lamination'],
    array['foto laminate precision', 'lamination', 'photo lamination'],
    '[]'::jsonb,
    null,
    null,
    'We build and support photo lamination machines designed for reliability and consistent output. Use this dashboard to manage posts and products.',
    true
  ),
  (
    'How to Choose the Right Lamination Machine',
    'how-to-choose-the-right-lamination-machine',
    'How to Choose the Right Lamination Machine',
    'A quick guide to selecting hot, cold, or roll lamination equipment for your workflow.',
    array['guide', 'machines'],
    array['lamination machine', 'hot lamination', 'cold lamination', 'roll lamination'],
    '[]'::jsonb,
    null,
    null,
    'Consider your materials, throughput, finish, and operator workflow. Hot lamination is great for durability, cold lamination for heat-sensitive media, and roll systems for high-volume production.',
    true
  ),
  (
    'Coda Lam Hydraulic & Pneumatically Controlled Cold Laminating Machines',
    'coda-lam-hydraulic-pneumatically-controlled-cold-laminating-machines',
    'Coda Lam Cold Laminating Machines',
    'Learn about advanced hydraulic and pneumatic cold laminating machines for superior quality.',
    array['cold lamination', 'machines'],
    array['cold laminating machine', 'hydraulic lamination', 'pneumatic lamination'],
    '[]'::jsonb,
    null,
    null,
    'Learn about advanced hydraulic and pneumatic cold laminating machines for superior quality and consistent results in production workflows.',
    true
  ),
  (
    'Karizma Album Making Machine',
    'karizma-album-making-machine',
    'Karizma Album Making Machine',
    'Discover the Karizma Album Making Machine for professional photo album production.',
    array['album making', 'machines'],
    array['karizma', 'album making machine', 'photo album'],
    '[]'::jsonb,
    null,
    null,
    'Discover the advanced Karizma Album Making Machine for professional photo album production and consistent finishing quality.',
    true
  ),
  (
    'UV Coating Machine 20 INCH',
    'uv-coating-machine-20-inch',
    'UV Coating Machine 20 INCH',
    'Explore our 20-inch UV coating machine designed for high-volume production.',
    array['uv coating', 'machines'],
    array['uv coating machine', 'coating', 'finishing'],
    '[]'::jsonb,
    null,
    null,
    'Explore our larger 20-inch UV Coating Machine designed for high-volume production and durable surface finish.',
    true
  )
on conflict (slug) do nothing;

-- PRODUCTS
insert into public.products
  (name, slug, category, summary, description, features, specs, cover_image_url, og_image_url, gallery_image_urls, published)
values
  (
    'Hot Lamination Machine',
    'hot-lamination-machine',
    'Lamination Machines',
    'Durable hot lamination for consistent, professional finish.',
    'A reliable hot lamination machine designed for smooth results and steady throughput in production environments.',
    array['Stable temperature control', 'Smooth roller pressure', 'Operator-friendly controls'],
    '{"power":"AC","use":"hot"}'::jsonb,
    null,
    null,
    array[]::text[],
    true
  ),
  (
    'Cold Lamination Machine',
    'cold-lamination-machine',
    'Lamination Machines',
    'Cold lamination for heat-sensitive prints and films.',
    'Cold lamination machine for applications where heat is not suitable, with stable feed and clean finish.',
    array['No-heat operation', 'Clean feed alignment', 'Low maintenance'],
    '{"power":"AC","use":"cold"}'::jsonb,
    null,
    null,
    array[]::text[],
    true
  ),
  (
    'Canvera Photo Album Making Machine',
    'canvera-photo-album-making-machine',
    'Album Making Machines',
    'Album making machine for consistent binding and finishing.',
    'A photo album making machine designed for smooth workflow and consistent finishing output.',
    array['Production-ready workflow', 'Consistent finishing', 'Operator-friendly controls'],
    '{"category":"album"}'::jsonb,
    null,
    null,
    array[]::text[],
    true
  ),
  (
    'Karizma Photo Album Making Machine',
    'karizma-photo-album-making-machine',
    'Album Making Machines',
    'Professional album making for high-quality output.',
    'Karizma album making machine for professional photo labs and production workflows.',
    array['Stable alignment', 'Smooth finishing', 'Designed for production'],
    '{"category":"album"}'::jsonb,
    null,
    null,
    array[]::text[],
    true
  ),
  (
    'Photo Frame Cutting Machine',
    'photo-frame-cutting-machine',
    'Finishing Machines',
    'Accurate cutting for photo frames and finishing.',
    'A cutting machine designed for accurate finishing and professional frame output.',
    array['Clean cuts', 'Consistent output', 'Workshop-friendly'],
    '{"category":"cutting"}'::jsonb,
    null,
    null,
    array[]::text[],
    true
  ),
  (
    'UV Coating Machine',
    'uv-coating-machine',
    'Finishing Machines',
    'Protective UV coating for improved surface finish.',
    'UV coating machine for production workflows that require durable surface protection and enhanced finish.',
    array['Consistent coating', 'Production-ready', 'Durable finish'],
    '{"category":"coating"}'::jsonb,
    null,
    null,
    array[]::text[],
    true
  )
on conflict (slug) do nothing;
