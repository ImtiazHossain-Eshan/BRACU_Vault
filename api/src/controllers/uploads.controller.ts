import { Hono, type Context } from "hono";
import { clerkMiddleware } from "@clerk/hono";
import type { AppEnv } from "../env";
import { getDb } from "../db/client";
import { requirePermission } from "../policies/guard";
import { PERMISSIONS } from "../policies/rbac";
import { UploadService } from "../services/upload.service";
import { Errors } from "../lib/respond";

/** Contribution uploads - gated behind the `uploads.create` permission, which
 *  only verified students hold. */
export const uploadsController = new Hono<AppEnv>();

uploadsController.use("*", clerkMiddleware());

function service(c: Context<AppEnv>) {
  return new UploadService(c.env, getDb(c.env));
}

// POST /api/v1/uploads - multipart form-data: file, [course], [category]
uploadsController.post("/uploads", async (c) => {
  const user = await requirePermission(c, PERMISSIONS.UPLOADS_CREATE);
  const form = await c.req.formData();
  const file = form.get("file");
  if (file === null || typeof file === "string") throw Errors.badRequest("Expected a 'file' field.");

  const row = await service(c).create({
    userId: user.userId,
    file,
    course: (form.get("course") as string | null) ?? null,
    category: (form.get("category") as string | null) ?? null,
    section: (form.get("section") as string | null) ?? null,
  });
  return c.json({ ok: true, id: row.id, filename: row.filename, status: row.status }, 201);
});

// GET /api/v1/uploads/mine - the caller's own uploads
uploadsController.get("/uploads/mine", async (c) => {
  const user = await requirePermission(c, PERMISSIONS.UPLOADS_CREATE);
  const rows = await service(c).list(user.userId);
  return c.json({
    uploads: rows.map((r) => ({
      id: r.id,
      filename: r.filename,
      size: r.size,
      status: r.status,
      course: r.course,
      createdAt: r.createdAt,
    })),
  });
});
