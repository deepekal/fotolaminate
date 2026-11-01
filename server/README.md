# API Server

This project uses a small Node API to:

- Connect to Supabase Postgres using the **session pooler connection string** (kept server-side)
- Provide CRUD endpoints for Blogs and Products
- Upload images to ImgBB without exposing the ImgBB API key to the browser

## Setup

1. Copy `.env.example` to `.env` and fill in:
   - `SUPABASE_POOLER_CONNECTION_STRING`
   - `IMGBB_API_KEY`
   - `ADMIN_TOKEN` (protects write/upload endpoints)
   - `ADMIN_USERNAME` and `ADMIN_PASSWORD` (required to log in to the dashboard)
2. Create tables by running [server/schema.sql](server/schema.sql) in the Supabase SQL editor.

## Run

- API only: `npm run dev:api`
- API + web: `npm run dev:full`

## Database

You can install the schema and seed sample data from the CLI (uses `SUPABASE_POOLER_CONNECTION_STRING`):

- Schema only: `npm run db:schema`
- Seed only: `npm run db:seed`
- Both: `npm run db:setup`

Health check: `GET /api/health`
