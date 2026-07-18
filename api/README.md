# BRACU Vault API

Cloudflare Worker backend for BRACU Vault. It handles verification, uploads, moderation, RBAC, file overrides, audit logs, and public catalog metadata.

## Stack

- Cloudflare Workers
- Hono
- TypeScript
- Cloudflare D1
- Drizzle ORM
- Cloudflare R2
- Clerk
- Zod

## Structure

```text
src/
|-- index.ts          Worker entrypoint and route mounting
|-- controllers/      HTTP parsing, auth checks, response shaping
|-- services/         Business logic
|-- repositories/     Drizzle and D1 access
|-- policies/         RBAC guards
|-- middleware/       Auth and error handling
|-- db/               Schema and client
`-- lib/              Shared helpers
```

Controllers stay thin. Business logic belongs in services. Database access belongs in repositories.

## Local Setup

```bash
npm ci
copy .dev.vars.example .dev.vars
npm run db:apply:local
npm run seed:rbac:local
npm run dev
```

Health check:

```bash
curl http://127.0.0.1:8787/api/v1/health
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start local Worker dev server |
| `npm run deploy` | Deploy Worker with Wrangler |
| `npm run typecheck` | TypeScript validation |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:apply:local` | Apply local D1 migrations |
| `npm run db:apply` | Apply remote D1 migrations |
| `npm run seed:rbac:local` | Seed local roles and permissions |
| `npm run seed:rbac` | Seed remote roles and permissions |
| `npm run db:backup` | Export remote D1 backup |
| `npm run roster:build` | Build HMAC roster seed SQL |

## Environment

Local secrets live in `.dev.vars`, copied from `.dev.vars.example`.

Production secrets should be set with Wrangler:

```bash
wrangler secret put CLERK_SECRET_KEY --env production
```

Never commit `.dev.vars`, backups, Wrangler state, or generated roster output.

## Main Routes

Base path: `/api/v1`

- `GET /health`
- `POST /verify/activate`
- `GET /verify/status`
- `POST /uploads`
- `GET /uploads/mine`
- `GET /catalog/uploads?course=`
- `GET /catalog/overrides`
- `GET /admin/overview`
- `GET /admin/uploads`
- `POST /admin/uploads/:id/:action`
- `POST /admin/uploads/:id`
- `GET /admin/uploads/:id/file`
- `GET /admin/files`
- `POST /admin/files/override`
- `GET /admin/users`
- `POST /admin/users/:id/role`
- `POST /admin/users/:id/status`
- `GET /admin/audit`
