-- Run this in your Supabase SQL editor.

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- BLOGS
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  meta_title text,
  meta_description text,
  tags text[] not null default '{}',
  keywords text[] not null default '{}',
  schemas jsonb not null default '[]'::jsonb,
  cover_image_url text,
  og_image_url text,
  content text not null default '',
  faqs jsonb not null default '[]'::jsonb,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_slug_idx on public.blog_posts (slug);
create index if not exists blog_posts_tags_gin_idx on public.blog_posts using gin (tags);

-- PRODUCTS
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text,
  summary text,
  description text not null default '',
  features text[] not null default '{}',
  specs jsonb not null default '{}'::jsonb,
  meta_title text,
  meta_description text,
  keywords text[] not null default '{}',
  cover_image_url text,
  og_image_url text,
  gallery_image_urls text[] not null default '{}',
  faqs jsonb not null default '[]'::jsonb,
  video_url text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_slug_idx on public.products (slug);
create index if not exists products_category_idx on public.products (category);

-- UPDATED_AT trigger
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_blog_posts_updated_at on public.blog_posts;
create trigger trg_blog_posts_updated_at before update on public.blog_posts
for each row execute function public.set_updated_at();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at before update on public.products
for each row execute function public.set_updated_at();

-- PAGES
create table if not exists public.pages (
  page_id text primary key,          -- e.g. "home", "about", "contact"
  path    text not null default '/',  -- URL path, e.g. "/"
  name    text not null default '',   -- Human-readable name
  content jsonb not null default '{}'::jsonb,  -- Full PageContent JSON
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_pages_updated_at on public.pages;
create trigger trg_pages_updated_at before update on public.pages
for each row execute function public.set_updated_at();
