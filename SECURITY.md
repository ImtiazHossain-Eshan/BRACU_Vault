# Security Policy

BRACU Vault handles student accounts, verified upload flows, moderation state, and file storage. Treat security issues seriously.

## Supported Version

Only the current deployed production version is supported.

## Reporting a Vulnerability

If the repository is public, use a private GitHub security advisory when available. If not, contact the maintainer directly.

Do not open a public issue containing:

- Secrets or tokens
- User email addresses
- Upload object keys that expose private data
- Exploit steps that allow account takeover, privilege escalation, or data access

## Secret Handling

Never commit:

- `api/.dev.vars`
- `landing/.env.local`
- Clerk secret keys
- R2 access keys
- Roster HMAC secrets
- D1 backups
- Wrangler local state

Production secrets belong in Cloudflare secrets or provider dashboards, not in source files.

## Security Controls

Current production controls include:

- Clerk email verification and domain allowlist
- Worker-side token verification
- Data-driven RBAC
- Upload quotas
- Duplicate upload rejection by hash
- Admin moderation before publishing community uploads
- Audit logging for privileged actions
- Public files served from a separate R2 bucket

