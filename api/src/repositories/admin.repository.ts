import { and, count, desc, eq, inArray, isNull, like } from "drizzle-orm";
import type { Db } from "../db/client";
import { auditLogs, uploads, userRoles, users } from "../db/schema";
import { nowSec, uuid } from "../lib/crypto";

export interface Overview {
  totalUsers: number;
  verifiedUsers: number;
  pendingUploads: number;
  totalUploads: number;
}

/** Read models + moderation writes for the admin dashboard. */
export class AdminRepository {
  constructor(private readonly db: Db) {}

  async overview(): Promise<Overview> {
    const [tu, vu, pu, au] = await Promise.all([
      this.db.select({ c: count() }).from(users).where(isNull(users.deletedAt)),
      this.db.select({ c: count() }).from(users).where(eq(users.status, "verified")),
      this.db.select({ c: count() }).from(uploads).where(and(eq(uploads.status, "pending"), isNull(uploads.deletedAt))),
      this.db.select({ c: count() }).from(uploads).where(isNull(uploads.deletedAt)),
    ]);
    return {
      totalUsers: tu[0]?.c ?? 0,
      verifiedUsers: vu[0]?.c ?? 0,
      pendingUploads: pu[0]?.c ?? 0,
      totalUploads: au[0]?.c ?? 0,
    };
  }

  async uploadsByStatus(status: string, limit = 60, offset = 0) {
    return this.db
      .select({
        id: uploads.id,
        filename: uploads.filename,
        size: uploads.size,
        course: uploads.course,
        section: uploads.section,
        status: uploads.status,
        createdAt: uploads.createdAt,
        uploaderEmail: users.email,
      })
      .from(uploads)
      .innerJoin(users, eq(users.id, uploads.userId))
      .where(and(eq(uploads.status, status), isNull(uploads.deletedAt)))
      .orderBy(desc(uploads.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /** R2 + status fields needed to publish/unpublish an upload on moderation. */
  async getUpload(id: string) {
    const rows = await this.db
      .select({
        id: uploads.id,
        r2Key: uploads.r2Key,
        filename: uploads.filename,
        mime: uploads.mime,
        publicKey: uploads.publicKey,
        status: uploads.status,
      })
      .from(uploads)
      .where(eq(uploads.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  /** Update an upload's moderation status (and optionally its public key) and
   *  write an audit log atomically. Pass publicKey=null to clear it. */
  async setUploadStatus(
    id: string,
    status: string,
    actorId: string,
    publicKey?: string | null,
  ): Promise<boolean> {
    const existing = await this.db.select({ status: uploads.status }).from(uploads).where(eq(uploads.id, id)).limit(1);
    if (existing.length === 0) return false;
    const ts = nowSec();
    const patch = publicKey === undefined ? { status } : { status, publicKey };
    await this.db.batch([
      this.db.update(uploads).set(patch).where(eq(uploads.id, id)),
      this.db.insert(auditLogs).values({
        id: uuid(),
        actorId,
        action: `upload.${status}`,
        entityType: "upload",
        entityId: id,
        oldValue: JSON.stringify({ status: existing[0]!.status }),
        newValue: JSON.stringify({ status }),
        createdAt: ts,
      }),
    ]);
    return true;
  }

  /** Every non-deleted upload (for the admin file manager). */
  async listAllUploads(limit = 1000) {
    return this.db
      .select({
        id: uploads.id,
        filename: uploads.filename,
        size: uploads.size,
        course: uploads.course,
        section: uploads.section,
        status: uploads.status,
        publicKey: uploads.publicKey,
        createdAt: uploads.createdAt,
        uploaderEmail: users.email,
      })
      .from(uploads)
      .innerJoin(users, eq(users.id, uploads.userId))
      .where(isNull(uploads.deletedAt))
      .orderBy(desc(uploads.createdAt))
      .limit(limit);
  }

  async softDeleteUpload(id: string, actorId: string): Promise<boolean> {
    const existing = await this.db.select({ status: uploads.status }).from(uploads).where(eq(uploads.id, id)).limit(1);
    if (existing.length === 0) return false;
    const ts = nowSec();
    await this.db.batch([
      this.db.update(uploads).set({ deletedAt: ts }).where(eq(uploads.id, id)),
      this.db.insert(auditLogs).values({
        id: uuid(), actorId, action: "upload.delete", entityType: "upload", entityId: id,
        oldValue: JSON.stringify({ status: existing[0]!.status }), createdAt: ts,
      }),
    ]);
    return true;
  }

  async updateUploadMeta(
    id: string,
    meta: { course?: string | null; section?: string | null; filename?: string },
    actorId: string,
  ): Promise<boolean> {
    const existing = await this.db.select({ id: uploads.id }).from(uploads).where(eq(uploads.id, id)).limit(1);
    if (existing.length === 0) return false;
    const clean: Record<string, unknown> = {};
    if (meta.course !== undefined) clean.course = meta.course;
    if (meta.section !== undefined) clean.section = meta.section;
    if (meta.filename) clean.filename = meta.filename;
    if (Object.keys(clean).length === 0) return true;
    const ts = nowSec();
    await this.db.batch([
      this.db.update(uploads).set(clean).where(eq(uploads.id, id)),
      this.db.insert(auditLogs).values({
        id: uuid(), actorId, action: "upload.edit", entityType: "upload", entityId: id,
        newValue: JSON.stringify(clean), createdAt: ts,
      }),
    ]);
    return true;
  }

  /** Append an audit row (used for archive-file overrides). */
  async writeAudit(action: string, entityType: string, entityId: string, value: unknown, actorId: string) {
    await this.db.insert(auditLogs).values({
      id: uuid(), actorId, action, entityType, entityId,
      newValue: value ? JSON.stringify(value) : undefined, createdAt: nowSec(),
    });
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  async listUsers(opts: { q?: string; status?: string; limit?: number; offset?: number }) {
    const conds = [isNull(users.deletedAt)];
    if (opts.status && opts.status !== "all") conds.push(eq(users.status, opts.status));
    if (opts.q) conds.push(like(users.email, `%${opts.q}%`));

    const rows = await this.db
      .select({ id: users.id, email: users.email, status: users.status, createdAt: users.createdAt })
      .from(users)
      .where(and(...conds))
      .orderBy(desc(users.createdAt))
      .limit(opts.limit ?? 100)
      .offset(opts.offset ?? 0);
    if (rows.length === 0) return [];

    const roleRows = await this.db
      .select({ userId: userRoles.userId, roleId: userRoles.roleId })
      .from(userRoles)
      .where(inArray(userRoles.userId, rows.map((r) => r.id)));
    const byUser = new Map<string, string[]>();
    for (const r of roleRows) byUser.set(r.userId, [...(byUser.get(r.userId) ?? []), r.roleId]);

    return rows.map((r) => ({ ...r, roles: byUser.get(r.id) ?? [] }));
  }

  /** Replace a user's roles with a single role (atomic) + audit. */
  async setUserRole(userId: string, role: string, actorId: string): Promise<boolean> {
    const exists = await this.db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
    if (exists.length === 0) return false;
    const ts = nowSec();
    await this.db.batch([
      this.db.delete(userRoles).where(eq(userRoles.userId, userId)),
      this.db.insert(userRoles).values({ userId, roleId: role, grantedBy: actorId, grantedAt: ts }),
      this.db.insert(auditLogs).values({
        id: uuid(), actorId, action: "user.set_role", entityType: "user", entityId: userId,
        newValue: JSON.stringify({ role }), createdAt: ts,
      }),
    ]);
    return true;
  }

  async setUserStatus(userId: string, status: string, actorId: string): Promise<boolean> {
    const existing = await this.db.select({ status: users.status }).from(users).where(eq(users.id, userId)).limit(1);
    if (existing.length === 0) return false;
    const ts = nowSec();
    await this.db.batch([
      this.db.update(users).set({ status, updatedAt: ts }).where(eq(users.id, userId)),
      this.db.insert(auditLogs).values({
        id: uuid(), actorId, action: `user.${status}`, entityType: "user", entityId: userId,
        oldValue: JSON.stringify({ status: existing[0]!.status }), newValue: JSON.stringify({ status }), createdAt: ts,
      }),
    ]);
    return true;
  }

  // ── Audit log ────────────────────────────────────────────────────────────────
  async listAudit(limit = 80, offset = 0) {
    return this.db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        createdAt: auditLogs.createdAt,
        actorEmail: users.email,
      })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.actorId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }
}
