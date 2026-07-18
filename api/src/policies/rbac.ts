/**
 * Role ladder + permission checks. The ladder ORDER is structural; the actual
 * permission-to-role mapping lives in the database (`role_permissions`) and is
 * seeded by scripts/seed-rbac.sql — never hardcoded into business logic. These
 * helpers are pure so they're usable on both Worker and (future) client.
 */

export const ROLE_LADDER = [
  "unverified",
  "pending",
  "verified_student",
  "moderator",
  "admin",
  "super_admin",
] as const;

export type RoleKey = (typeof ROLE_LADDER)[number];

/** Canonical permission keys (kept in sync with seed-rbac.sql). */
export const PERMISSIONS = {
  UPLOADS_CREATE: "uploads.create",
  UPLOADS_MODERATE: "uploads.moderate",
  UPLOADS_DELETE: "uploads.delete",
  USERS_VERIFY: "users.verify",
  USERS_BAN: "users.ban",
  USERS_DELETE: "users.delete",
  ADMINS_MANAGE: "admins.manage",
  ROLES_MANAGE: "roles.manage",
  DATA_EXPORT: "data.export",
  SETTINGS_EDIT: "settings.edit",
  ANALYTICS_READ: "analytics.read",
  SECURITY_READ: "security.read",
  AUDIT_READ: "audit.read",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export function roleRank(key: RoleKey): number {
  return ROLE_LADDER.indexOf(key);
}

/** Ladder comparison — true if `actual` sits at or above `required`. */
export function meetsRole(actual: RoleKey, required: RoleKey): boolean {
  return roleRank(actual) >= roleRank(required);
}

/** Granular check against a user's resolved permission set (from the DB). */
export function can(granted: ReadonlySet<string>, permission: PermissionKey): boolean {
  return granted.has(permission);
}
