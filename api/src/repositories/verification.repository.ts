import { desc, eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { auditLogs, userRoles, users, verificationAttempts, verifications } from "../db/schema";
import { uuid, nowSec } from "../lib/crypto";

export interface ActivateInput {
  userId: string;
  email: string;
  roleId: string;
  ip: string | null;
  userAgent: string | null;
}

export interface AttemptInput {
  userId: string | null;
  kind: string; // email_verify | id_check | ...
  result: "pass" | "fail" | "rate_limited";
  ip: string | null;
  userAgent: string | null;
}

/** Verification aggregate: the verification record, abuse-tracking attempts,
 *  and the atomic "mark verified + grant role" write. */
export class VerificationRepository {
  constructor(private readonly db: Db) {}

  async latestForUser(userId: string) {
    const rows = await this.db
      .select()
      .from(verifications)
      .where(eq(verifications.userId, userId))
      .orderBy(desc(verifications.createdAt))
      .limit(1);
    return rows[0];
  }

  async recordAttempt(input: AttemptInput): Promise<void> {
    await this.db.insert(verificationAttempts).values({
      id: uuid(),
      userId: input.userId,
      kind: input.kind,
      result: input.result,
      ip: input.ip,
      userAgent: input.userAgent,
    });
  }

  /**
   * Atomically mark the user verified, record the verification, grant the
   * verified_student role, and write the audit log - in one D1 batch.
   * Verification is by university email (Clerk proves ownership), so there is
   * no Student ID here.
   */
  async commitActivate(input: ActivateInput): Promise<void> {
    const ts = nowSec();
    await this.db.batch([
      this.db
        .update(users)
        .set({ status: "verified", emailVerifiedAt: ts, updatedAt: ts })
        .where(eq(users.id, input.userId)),
      this.db.insert(verifications).values({
        id: uuid(),
        userId: input.userId,
        status: "verified",
        email: input.email,
        idCheckPassed: false,
        emailCheckPassed: true,
        method: "auto",
        createdAt: ts,
        updatedAt: ts,
      }),
      this.db
        .insert(userRoles)
        .values({ userId: input.userId, roleId: input.roleId, grantedBy: input.userId, grantedAt: ts })
        .onConflictDoNothing(),
      this.db.insert(auditLogs).values({
        id: uuid(),
        actorId: input.userId,
        action: "verification.activate",
        entityType: "user",
        entityId: input.userId,
        newValue: JSON.stringify({ via: "email", role: input.roleId }),
        ip: input.ip,
        userAgent: input.userAgent,
        createdAt: ts,
      }),
    ]);
  }
}
