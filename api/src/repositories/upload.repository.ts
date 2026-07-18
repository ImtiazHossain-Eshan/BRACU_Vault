import { and, desc, eq, gt, isNull } from "drizzle-orm";
import type { Db } from "../db/client";
import { uploads } from "../db/schema";
import { uuid } from "../lib/crypto";

export type UploadRow = typeof uploads.$inferSelect;

export interface NewUpload {
  userId: string;
  r2Key: string;
  filename: string;
  mime: string | null;
  size: number;
  sha256: string;
  course: string | null;
  category: string | null;
  section: string | null;
}

/** Data access for contributed uploads (metadata; bytes live in R2). */
export class UploadRepository {
  constructor(private readonly db: Db) {}

  async create(input: NewUpload): Promise<UploadRow> {
    const id = uuid();
    await this.db.insert(uploads).values({ id, ...input, status: "pending" });
    const rows = await this.db.select().from(uploads).where(eq(uploads.id, id)).limit(1);
    return rows[0]!;
  }

  async listByUser(userId: string, limit = 50): Promise<UploadRow[]> {
    return this.db
      .select()
      .from(uploads)
      .where(and(eq(uploads.userId, userId), isNull(uploads.deletedAt)))
      .orderBy(desc(uploads.createdAt))
      .limit(limit);
  }

  /** Sizes of a user's uploads since `sinceSec` (for daily quota checks). */
  async recentSizes(userId: string, sinceSec: number): Promise<number[]> {
    const rows = await this.db
      .select({ size: uploads.size })
      .from(uploads)
      .where(and(eq(uploads.userId, userId), isNull(uploads.deletedAt), gt(uploads.createdAt, sinceSec)))
      .limit(500);
    return rows.map((r) => r.size);
  }

  /** True if this user already has a live upload with the same content hash. */
  async hasDuplicate(userId: string, sha256: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: uploads.id })
      .from(uploads)
      .where(and(eq(uploads.userId, userId), eq(uploads.sha256, sha256), isNull(uploads.deletedAt)))
      .limit(1);
    return rows.length > 0;
  }

  /** All approved, published uploads (public catalog source). */
  async listApproved(limit = 500): Promise<UploadRow[]> {
    return this.db
      .select()
      .from(uploads)
      .where(and(eq(uploads.status, "approved"), isNull(uploads.deletedAt)))
      .orderBy(desc(uploads.createdAt))
      .limit(limit);
  }
}
