/** Bindings + vars available on every request (`c.env`). Mirrors wrangler.toml.
 *  Secrets are injected by Workers at runtime; non-secret vars come from [vars]. */
export interface Env {
  // Bindings — names must match the `binding` fields in wrangler.toml.
  bracu_vault: D1Database;
  bracu_vault_uploads: R2Bucket;
  /** Public archive bucket (served at files.bracuvault.me). Approved community
   *  uploads are copied here so they reuse the normal file-serving pipeline. */
  bracu_vault_files: R2Bucket;

  // Non-secret vars
  ENVIRONMENT: string;
  /** Public site origin (e.g. https://bracuvault.me) — used for CORS + links. */
  SITE_URL: string;
  /** Comma-separated allowlist, e.g. "g.bracu.ac.bd". Source of truth moves to
   *  the `settings` table later; this is the bootstrap default. */
  ALLOWED_EMAIL_DOMAINS: string;

  // Secrets (set via `wrangler secret put` / .dev.vars)
  ROSTER_HMAC_SECRET: string;
  /** Clerk backend key — verifies session JWTs and reads user identity. */
  CLERK_SECRET_KEY: string;
  /** Clerk publishable key (public) — required by the Clerk middleware. */
  CLERK_PUBLISHABLE_KEY: string;
  /** Optional: transactional email for admin notifications (Phase 5+). */
  RESEND_API_KEY: string;
  /** Optional: Cloudflare Turnstile for public endpoints. */
  TURNSTILE_SECRET: string;
}

/** Hono generic so handlers get typed `c.env`. */
export type AppEnv = { Bindings: Env };
