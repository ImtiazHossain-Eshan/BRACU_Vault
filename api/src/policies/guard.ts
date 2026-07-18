import type { Context } from "hono";
import type { AppEnv } from "../env";
import { getDb } from "../db/client";
import { requireAuth, type AuthIdentity } from "../middleware/auth";
import { UserRepository } from "../repositories/user.repository";
import { RbacRepository } from "../repositories/rbac.repository";
import { Errors } from "../lib/respond";
import type { PermissionKey } from "./rbac";

export interface AuthedUser extends AuthIdentity {
  /** Our internal domain user id (not the Clerk id). */
  userId: string;
}

/** requireAuth + assert the user holds a permission (resolved from DB roles).
 *  Throws 401 if not signed in, 403 if unverified or missing the permission. */
export async function requirePermission(
  c: Context<AppEnv>,
  permission: PermissionKey,
): Promise<AuthedUser> {
  const id = await requireAuth(c);
  const db = getDb(c.env);
  const user = await new UserRepository(db).getByClerkId(id.clerkUserId);
  if (!user) throw Errors.forbidden("Verify your account before continuing.");
  const perms = await new RbacRepository(db).permissionsForUser(user.id);
  if (!perms.has(permission)) throw Errors.forbidden("You don't have permission to do that.");
  return { ...id, userId: user.id };
}
