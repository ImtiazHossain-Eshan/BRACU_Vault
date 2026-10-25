import type { Context } from "hono";
import { getAuth } from "@clerk/hono";
import { Errors } from "../lib/respond";
import type { AppEnv } from "../env";

/** The authenticated caller, resolved from the Clerk session. */
export interface AuthIdentity {
  clerkUserId: string;
  email: string;
  emailVerified: boolean;
}

/**
 * Resolve and require a signed-in Clerk user. Throws 401 if absent. Reads the
 * primary email + its verification status from Clerk - these are the source of
 * truth for email ownership (Clerk owns that flow), so the Worker never sees or
 * stores an OTP. Requires `clerkMiddleware()` to have run earlier in the chain.
 */
export async function requireAuth(c: Context<AppEnv>): Promise<AuthIdentity> {
  const auth = getAuth(c);
  if (!auth?.userId) throw Errors.unauthorized();

  const clerk = c.get("clerk");
  const user = await clerk.users.getUser(auth.userId);

  const primary =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId) ??
    user.emailAddresses[0];
  if (!primary) throw Errors.badRequest("Your account has no email address.");

  return {
    clerkUserId: user.id,
    email: primary.emailAddress.toLowerCase(),
    emailVerified: primary.verification?.status === "verified",
  };
}

/** Request metadata for audit + abuse logging. */
export function requestCtx(c: Context<AppEnv>): { ip: string | null; userAgent: string | null } {
  return {
    ip: c.req.header("cf-connecting-ip") ?? null,
    userAgent: c.req.header("user-agent") ?? null,
  };
}
