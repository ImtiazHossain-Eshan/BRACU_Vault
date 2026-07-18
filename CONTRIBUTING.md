# Contributing

Thanks for helping improve BRACU Vault. This project is a deployed student-run product, so changes should be small, testable, and clear.

## Local Setup

```bash
npm --prefix api ci
npm --prefix landing ci
copy api\.dev.vars.example api\.dev.vars
copy landing\.env.example landing\.env.local
```

Run locally:

```bash
npm run dev:api
npm run dev:landing
```

Validate before opening a pull request:

```bash
npm run check
```

## Pull Request Expectations

- Keep changes scoped to one feature, fix, or docs update.
- Do not commit secrets, exported databases, `.wrangler`, `.next`, `out`, or `node_modules`.
- Include screenshots for visible UI changes.
- Include migration notes for D1 schema changes.
- Explain deployment impact if a change touches Cloudflare Pages, Workers, D1, R2, Clerk, or DNS.

## Code Style

- Prefer existing patterns over new abstractions.
- Keep controllers thin and put business logic in services.
- Keep SQL and Drizzle queries inside repositories.
- Preserve the student-run, unofficial positioning in public copy.

