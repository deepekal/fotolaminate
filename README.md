# Foto Laminate Precision

Marketing website for Foto Laminate Precision, built with React, TypeScript, Vite, and Tailwind CSS.

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install and Ru

```sh
npm install
cp .env.example .env
# Fill SUPABASE_POOLER_CONNECTION_STRING, IMGBB_API_KEY, ADMIN_TOKEN, ADMIN_USERNAME, and ADMIN_PASSWORD in .env

# Run DB schema in Supabase SQL editor:
# server/schema.sql

# Or run schema + seed from the CLI:
# npm run db:setup

npm run dev:full
```

The development server runs on `http://localhost:8080`.

The API server runs on `http://localhost:8787` and is proxied in dev via `/api`.

## Production Notes (Dashboard)

Two common production requirements:

1) **SPA rewrite for React Router**: your hosting must rewrite routes like `/dashboard` and `/products/...` to `index.html`.
2) **API routing**: Vite's `/api` proxy is **development only**.

In production you must ensure `/api/*` requests are handled by a real API:

- **Vercel (recommended)**: this repo includes Vercel API routes under `api/` that forward to the Express app.
	- Set these env vars in Vercel Project Settings → Environment Variables:
		- `SUPABASE_POOLER_CONNECTION_STRING`
		- `ADMIN_TOKEN`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`
		- `IMGBB_API_KEY` (only if you use uploads)
	- Leave `VITE_API_BASE_URL` empty (frontend will call same-origin `/api`).
- **Non-Vercel hosting**: deploy the API server separately and either:
	- Put it on the **same domain** and reverse-proxy `/api` to it, OR
	- Host it on a different origin and set `VITE_API_BASE_URL` at build time (example: `https://api.yourdomain.com`).

## Available Scripts

- `npm run dev` - Start the development server
- `npm run dev:api` - Start the API server (Supabase pooler + ImgBB uploads)
- `npm run dev:full` - Start both API + web
- `npm run build` - Bui=ld for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint
- `npm run test` - Run tests once
- `npm run test:watch` - Run tests in watch mode

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- Vitest + Testing Library
