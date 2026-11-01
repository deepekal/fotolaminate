-- Add faqs column to blog_posts table if it doesn't exist
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS faqs jsonb NOT NULL DEFAULT '[]'::jsonb;
