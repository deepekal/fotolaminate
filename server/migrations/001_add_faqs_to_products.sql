-- Add faqs column to products table if it doesn't exist
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS faqs jsonb NOT NULL DEFAULT '[]'::jsonb;
