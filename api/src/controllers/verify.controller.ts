import { Hono, type Context } from "hono";
import { clerkMiddleware } from "@clerk/hono";
import type { AppEnv } from "../env";
import { getDb } from "../db/client";
import { requireAuth, requestCtx } from "../middleware/auth";
import { VerificationService } from "../services/verification.service";

/** Student verification — by university email only (Clerk proves ownership). */
export const verifyController = new Hono<AppEnv>();

verifyController.use("*", clerkMiddleware());

function service(c: Context<AppEnv>) {
  return new VerificationService(c.env, getDb(c.env));
}

// POST /api/v1/verify/activate — mark the signed-in user verified, unlock uploads.
verifyController.post("/verify/activate", async (c) => {
  const id = await requireAuth(c);
  return c.json(await service(c).activate(id, requestCtx(c)));
});

// GET /api/v1/verify/status — current verification + upload-permission snapshot.
verifyController.get("/verify/status", async (c) => {
  const id = await requireAuth(c);
  return c.json(await service(c).getStatus(id.clerkUserId));
});
