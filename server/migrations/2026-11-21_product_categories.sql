-- Product categories managed from /dashboard. Run once on the live DB before deploying feat/admin-categories.
create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists product_categories_name_key on public.product_categories (lower(name));
create unique index if not exists product_categories_slug_key on public.product_categories (slug);

-- Seed: the site categories in display order, then any other names already used on products.
insert into public.product_categories (name, slug, sort_order) values
 ('Cold Lamination Machine','cold-lamination-machine',10),
 ('Thermal Lamination Machine','thermal-lamination-machine',20),
 ('UV Coating Machine','uv-coating-machine',30),
 ('Karizma Photo Album Machine','karizma-photo-album-machine',40),
 ('Cutting Machine','cutting-machine',50),
 ('Photo Frame Cutting Machine','photo-frame-cutting-machine',60),
 ('Machine Accessories & Raw Materials','machine-accessories-and-raw-materials',70)
on conflict do nothing;

insert into public.product_categories (name, slug, sort_order)
select distinct on (lower(trim(category))) trim(category),
       left(regexp_replace(regexp_replace(regexp_replace(lower(replace(trim(category),'&',' and ')),'[''"]','','g'),'[^a-z0-9]+','-','g'),'(^-+|-+$)','','g'),80),
       100
from public.products
where coalesce(trim(category),'') <> ''
  and lower(trim(category)) not in (select lower(name) from public.product_categories)
on conflict do nothing;
