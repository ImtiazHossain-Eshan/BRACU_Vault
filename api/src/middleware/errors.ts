import type { ErrorHandler } from "hono";
import { ZodError } from "zod";
import { HttpError } from "../lib/respond";
import type { AppEnv } from "../env";

/** Central error translator (registered via app.onError). Mirrors the repo's
 *  existing `withErrorHandling` contract:
 *    ZodError  → 400 with field-level issues
 *    HttpError → its status + safe message
 *    anything else → 500 with a stable id; full error logged server-side only. */
export const onError: ErrorHandler<AppEnv> = (err, c) => {
  if (err instanceof ZodError) {
    return c.json(
      {
        error: "Validation failed",
        issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
      400,
    );
  }

  if (err instanceof HttpError) {
    return c.json({ error: err.message, details: err.details ?? undefined }, err.status as 400);
  }

  const id = crypto.randomUUID();
  console.error(`[api] unhandled error id=${id}:`, err);
  return c.json({ error: "Internal error", id }, 500);
};
