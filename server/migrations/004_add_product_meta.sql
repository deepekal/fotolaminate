-- Migration 004: add product meta tags
-- Run this in your Supabase SQL editor.

alter table public.products
add column if not exists meta_title text,
add column if not exists meta_description text,
add column if not exists keywords text[] not null default '{}';
