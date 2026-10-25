import type { Env } from "../env";
import type { Db } from "../db/client";
import { Errors } from "../lib/respond";
import { PERMISSIONS } from "../policies/rbac";
import { UserRepository } from "../repositories/user.repository";
import { VerificationRepository } from "../repositories/verification.repository";
import { RbacRepository } from "../repositories/rbac.repository";

const VERIFIED_STUDENT_ROLE = "verified_student";

export interface Identity {
  clerkUserId: string;
  email: string;
  emailVerified: boolean;
}
export interface RequestCtx {
  ip: string | null;
  userAgent: string | null;
}
export interface VerificationStatus {
  status: string;
  verified: boolean;
  roles: string[];
  canUpload: boolean;
  email?: string;
}

/**
 * Student verification, by university email only. Clerk proves the caller owns
 * a verified `@g.bracu.ac.bd` address (and its allowlist blocks every other
 * domain at sign-up), which is sufficient proof of BRAC studenthood - so there
 * is no Student ID step. We re-check the domain server-side as defense in depth.
 */
export class VerificationService {
  private readonly users: UserRepository;
  private readonly verifs: VerificationRepository;
  private readonly rbac: RbacRepository;

  constructor(
    private readonly env: Env,
    db: Db,
  ) {
    this.users = new UserRepository(db);
    this.verifs = new VerificationRepository(db);
    this.rbac = new RbacRepository(db);
  }

  private isAllowedEmail(email: string): boolean {
    const domains = this.env.ALLOWED_EMAIL_DOMAINS.split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
    const domain = email.split("@")[1]?.toLowerCase() ?? "";
    return domains.includes(domain);
  }

  /** Verify the signed-in user by their university email. Idempotent. */
  async activate(id: Identity, ctx: RequestCtx): Promise<VerificationStatus> {
    if (!id.emailVerified) throw Errors.forbidden("Verify your university email first.");
    if (!this.isAllowedEmail(id.email)) {
      throw Errors.forbidden("Sign in with your @g.bracu.ac.bd university email.");
    }

    const user = await this.users.ensureFromClerk(id.clerkUserId, id.email);

    if (user.status !== "verified") {
      try {
        await this.verifs.commitActivate({
          userId: user.id,
          email: id.email,
          roleId: VERIFIED_STUDENT_ROLE,
          ip: ctx.ip,
          userAgent: ctx.userAgent,
        });
      } catch (err) {
        // Tolerate a concurrent activate (unique/constraint race); rethrow others.
        const msg = err instanceof Error ? err.message : String(err);
        if (!/unique|constraint/i.test(msg)) throw err;
      }
      await this.verifs.recordAttempt({
        userId: user.id,
        kind: "email_verify",
        result: "pass",
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    }

    return this.statusForUser(user.id, "verified", id.email);
  }

  async getStatus(clerkUserId: string): Promise<VerificationStatus> {
    const user = await this.users.getByClerkId(clerkUserId);
    if (!user) return { status: "unverified", verified: false, roles: [], canUpload: false };
    return this.statusForUser(user.id, user.status);
  }

  private async statusForUser(
    userId: string,
    status: string,
    email?: string,
  ): Promise<VerificationStatus> {
    const [roles, perms] = await Promise.all([
      this.rbac.rolesForUser(userId),
      this.rbac.permissionsForUser(userId),
    ]);
    return {
      status,
      verified: status === "verified",
      roles,
      canUpload: perms.has(PERMISSIONS.UPLOADS_CREATE),
      email,
    };
  }
}
