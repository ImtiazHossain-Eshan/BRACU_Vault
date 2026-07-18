# BRACU Vault Landing

Next.js frontend for BRACU Vault. It includes the public course archive, homepage, orbit view, dashboard, upload UI, file previews, and admin dashboard.

## Stack

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Clerk React
- PDF.js
- Zustand

The app is built as a static export and deployed to Cloudflare Pages.

## Local Setup

```bash
npm ci
copy .env.example .env.local
npm run dev
```

Local URL:

```text
http://localhost:3000
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start Next dev server |
| `npm run build` | Build static export |
| `npm run start` | Start Next production server, useful before static export changes |
| `npm run lint` | Run Next lint |
| `npm run gen:icons` | Generate PWA icons |
| `npm run convert:pdf` | Convert Office files to cached PDFs |

## Environment

Copy `.env.example` to `.env.local`.

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_replace_me
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787
NEXT_PUBLIC_FILES_BASE_URL=
```

Production uses:

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.bracuvault.me
NEXT_PUBLIC_FILES_BASE_URL=https://files.bracuvault.me
```

Only `NEXT_PUBLIC_*` values are exposed to the browser. Do not put secret keys in this app.

## Structure

```text
app/                 Routes, metadata, sitemap, robots, manifest
components/          UI, archive, upload, admin, preview, PWA components
hooks/               Client hooks
lib/                 Data access helpers, catalog utilities, API clients
public/              Icons, headers, service worker, static browser assets
scripts/             Asset and PDF preparation scripts
store/               Local UI state
```

## SEO

The app generates:

- `robots.txt`
- `sitemap.xml`
- Canonical tags
- WebSite JSON-LD
- CollectionPage JSON-LD for course pages
- FAQPage JSON-LD on the homepage

Indexable pages are homepage, orbit, and course pages. Utility pages such as dashboard, verify, brand, and admin are noindexed.

