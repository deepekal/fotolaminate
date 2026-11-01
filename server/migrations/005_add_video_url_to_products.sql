-- Migration 005: Add video_url column to products table
-- Run this in your Supabase SQL editor.

alter table public.products
  add column if not exists video_url text;
