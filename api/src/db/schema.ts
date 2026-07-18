import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * Phase 0 core schema (Cloudflare D1 / SQLite). Timestamps are unix seconds
 * (integer) to stay edge-friendly. Enum-like columns are validated at the
 * service/Zod layer; CHECK constraints can be layered on later.
 *
 * Naming: snake_case columns, plural tables. Foreign keys declared inline with
 * explicit ON DELETE behaviour. Indexes cover the hot lookup/sort paths.
 */

const unixNow = sql`(strftime('%s','now'))`;

// ── Identity ─────────────────────────────────────────────────────────────────
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    // Identity is owned by Clerk (auth, email ownership, sessions). This links
    // our domain user to the Clerk user; email/verified-state are mirrored from it.
    clerkUserId: text("clerk_user_id"),
    email: text("email").notNull(), // stored lowercased → plain unique = case-insensitive
    emailVerifiedAt: integer("email_verified_at"),
    studentId: text("student_id"), // the user's own verified ID (nullable until linked)
    displayName: text("display_name"),
    status: text("status").notNull().default("pending"), // pending|verified|rejected|expired|suspended|banned
    createdAt: integer("created_at").notNull().default(unixNow),
    updatedAt: integer("updated_at").notNull().default(unixNow),
    deletedAt: integer("deleted_at"), // soft delete
  },
  (t) => ({
    emailUnique: uniqueIndex("users_email_unique").on(t.email),
    clerkUnique: uniqueIndex("users_clerk_unique").on(t.clerkUserId),
    // one Student ID → at most one VERIFIED account (partial unique)
    studentVerifiedUnique: uniqueIndex("users_student_verified_unique")
      .on(t.studentId)
      .where(sql`student_id IS NOT NULL AND status = 'verified'`),
    statusIdx: index("users_status_idx").on(t.status, t.createdAt),
  }),
);

// ── RBAC (data-driven; never hardcoded) ──────────────────────────────────────
export const roles = sqliteTable(
  "roles",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull(), // unverified|pending|verified_student|moderator|admin|super_admin
    name: text("name").notNull(),
    rank: integer("rank").notNull(), // ordered ladder
  },
  (t) => ({ keyUnique: uniqueIndex("roles_key_unique").on(t.key) }),
);

export const permissions = sqliteTable(
  "permissions",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull(), // e.g. uploads.create, users.ban
    description: text("description"),
  },
  (t) => ({ keyUnique: uniqueIndex("permissions_key_unique").on(t.key) }),
);

export const rolePermissions = sqliteTable(
  "role_permissions",
  {
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.roleId, t.permissionId] }) }),
);

export const userRoles = sqliteTable(
  "user_roles",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    grantedBy: text("granted_by").references(() => users.id, { onDelete: "set null" }),
    grantedAt: integer("granted_at").notNull().default(unixNow),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.roleId] }) }),
);

// ── Roster (source of truth — Student IDs stored as HMAC) ─────────────────────
export const rosterImports = sqliteTable("roster_imports", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  rowCount: integer("row_count").notNull(),
  sha256: text("sha256").notNull(),
  importedBy: text("imported_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: integer("created_at").notNull().default(unixNow),
});

export const studentRoster = sqliteTable(
  "student_roster",
  {
    id: text("id").primaryKey(),
    studentIdHmac: text("student_id_hmac").notNull(),
    idFormat: integer("id_format").notNull(), // detected digit length (8 or 10)
    sl: integer("sl"),
    importId: text("import_id").references(() => rosterImports.id, { onDelete: "cascade" }),
  },
  (t) => ({ hmacUnique: uniqueIndex("roster_hmac_unique").on(t.studentIdHmac) }),
);

// ── Verification ─────────────────────────────────────────────────────────────
export const verifications = sqliteTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"), // pending|verified|rejected|expired|suspended
    studentId: text("student_id"),
    email: text("email"),
    idCheckPassed: integer("id_check_passed", { mode: "boolean" }).notNull().default(false),
    emailCheckPassed: integer("email_check_passed", { mode: "boolean" }).notNull().default(false),
    method: text("method").notNull().default("auto"), // auto|manual
    reviewedBy: text("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: integer("reviewed_at"),
    reason: text("reason"),
    createdAt: integer("created_at").notNull().default(unixNow),
    updatedAt: integer("updated_at").notNull().default(unixNow),
  },
  (t) => ({ userIdx: index("verifications_user_idx").on(t.userId) }),
);

// Note: email-ownership OTP is delegated to Clerk; we only track our own
// student-side attempts below for abuse analytics.
export const verificationAttempts = sqliteTable(
  "verification_attempts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    kind: text("kind").notNull(), // id_check|email_send|otp_verify
    result: text("result").notNull(), // pass|fail|rate_limited
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: integer("created_at").notNull().default(unixNow),
  },
  (t) => ({ ipIdx: index("vatt_ip_idx").on(t.ip, t.createdAt) }),
);

// ── Audit (append-only) ──────────────────────────────────────────────────────
export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    oldValue: text("old_value"), // JSON string
    newValue: text("new_value"), // JSON string
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: integer("created_at").notNull().default(unixNow),
  },
  (t) => ({
    entityIdx: index("audit_entity_idx").on(t.entityType, t.entityId),
    actorIdx: index("audit_actor_idx").on(t.actorId, t.createdAt),
  }),
);

// ── Uploads (contributed files; bytes live in R2, metadata here) ──────────────
export const uploads = sqliteTable(
  "uploads",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    r2Key: text("r2_key").notNull(),
    filename: text("filename").notNull(),
    mime: text("mime"),
    size: integer("size").notNull(),
    sha256: text("sha256"),
    course: text("course"),
    category: text("category"),
    section: text("section"), // folder path within a course, e.g. "Lab / Assignments"
    publicKey: text("public_key"), // key in the public files bucket once approved
    status: text("status").notNull().default("pending"), // pending|approved|rejected|flagged|removed
    createdAt: integer("created_at").notNull().default(unixNow),
    deletedAt: integer("deleted_at"),
  },
  (t) => ({
    userIdx: index("uploads_user_idx").on(t.userId, t.createdAt),
    statusIdx: index("uploads_status_idx").on(t.status, t.createdAt),
    shaIdx: index("uploads_sha_idx").on(t.sha256),
  }),
);

// ── Archive file overrides (admin edits/deletes of the static preloaded files) ──
export const fileOverrides = sqliteTable("file_overrides", {
  p: text("p").primaryKey(), // vault-index path = archive file id
  hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
  name: text("name"),
  course: text("course"),
  section: text("section"),
  size: integer("size"),
  updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: integer("updated_at").notNull().default(unixNow),
});
