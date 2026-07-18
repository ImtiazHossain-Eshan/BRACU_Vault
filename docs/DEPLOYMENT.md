# Deployment

This project is deployed on Cloudflare:

- Frontend: Cloudflare Pages
- API: Cloudflare Workers
- Database: Cloudflare D1
- Files: Cloudflare R2
- Auth: Clerk

## Production Domains

| Domain | Purpose |
| --- | --- |
| `bracuvault.me` | Main site |
| `api.bracuvault.me` | Worker API |
| `files.bracuvault.me` | Public R2 files |
| `clerk.bracuvault.me`, `accounts.bracuvault.me`, `clkmail.bracuvault.me` | Clerk |

Clerk CNAMEs must be DNS-only in Cloudflare. Pages, API, and files can stay proxied.

## API Deploy

From `api/`:

```bash
npm ci
npm run typecheck
wrangler deploy --env production
```

Apply remote migrations when needed:

```bash
wrangler d1 migrations apply bracu_vault --remote
```

Set production secrets through Wrangler:

```bash
wrangler secret put CLERK_SECRET_KEY --env production
```

Do not paste secret values into source files or chat logs.

## Landing Deploy

From `landing/`:

```bash
npm ci
npm run build
wrangler pages deploy out --project-name=bracu-vault --branch=main
```

Required production build env:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuYnJhY3V2YXVsdC5tZSQ
NEXT_PUBLIC_API_BASE_URL=https://api.bracuvault.me
NEXT_PUBLIC_FILES_BASE_URL=https://files.bracuvault.me
```

The Clerk publishable key is public. Secret keys are not public.

## Redirect Rules

To prevent duplicate indexing, configure Cloudflare redirects:

| Source | Target | Status |
| --- | --- | --- |
| `www.bracuvault.me` | `https://bracuvault.me` | 301 |
| `bracu-vault.pages.dev` | `https://bracuvault.me` | 301 |

Enable:

- Preserve query string
- Subpath matching
- Preserve path suffix

## Smoke Tests

After deploy:

```bash
curl https://api.bracuvault.me/api/v1/health
curl https://bracuvault.me/sitemap.xml
```

Manual checks:

- Homepage loads
- Course page loads
- Search opens
- Sign-in modal opens
- Verified upload flow works
- Admin tabs load for an admin account
- Approved community upload appears in its course folder

