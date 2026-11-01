-- Migration 003: add pages table
-- Run this in your Supabase SQL editor.

create table if not exists public.pages (
  page_id text primary key,          -- e.g. "home", "about", "contact"
  path    text not null default '/',  -- URL path, e.g. "/"
  name    text not null default '',   -- Human-readable name
  content jsonb not null default '{}'::jsonb,  -- Full PageContent JSON
  updated_at timestamptz not null default now()
);

create or replace function public.set_pages_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_pages_updated_at on public.pages;
create trigger trg_pages_updated_at before update on public.pages
for each row execute function public.set_pages_updated_at();
