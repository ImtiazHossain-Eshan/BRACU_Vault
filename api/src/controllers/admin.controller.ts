import { Hono, type Context } from "hono";
import { clerkMiddleware } from "@clerk/hono";
import type { AppEnv } from "../env";
import { getDb } from "../db/client";
import { requirePermission } from "../policies/guard";
import { PERMISSIONS, ROLE_LADDER } from "../policies/rbac";
import { AdminService } from "../services/admin.service";
import { Errors } from "../lib/respond";

const USER_STATUSES = ["verified", "pending", "suspended", "banned"];

/** Admin dashboard API. Each route is permission-gated (deny by default). */
export const adminController = new Hono<AppEnv>();

adminController.use("*", clerkMiddleware());

function service(c: Context<AppEnv>) {
  return new AdminService(c.env, getDb(c.env));
}

/** Parse a non-negative integer query param with a default and a cap. */
function intQuery(c: Context<AppEnv>, name: string, def: number, max: number): number {
  const n = Number.parseInt(c.req.query(name) ?? "", 10);
  if (Number.isNaN(n) || n < 0) return def;
  return Math.min(n, max);
}

// GET /api/v1/admin/overview — headline counts
adminController.get("/admin/overview", async (c) => {
  await requirePermission(c, PERMISSIONS.ANALYTICS_READ);
  return c.json(await service(c).overview());
});

// GET /api/v1/admin/uploads?status=pending&limit=&offset= — moderation queue (paged)
adminController.get("/admin/uploads", async (c) => {
  await requirePermission(c, PERMISSIONS.UPLOADS_MODERATE);
  const status = c.req.query("status") ?? "pending";
  const limit = intQuery(c, "limit", 30, 100);
  const offset = intQuery(c, "offset", 0, 100_000);
  return c.json(await service(c).queue(status, limit, offset));
});

// POST /api/v1/admin/uploads/:id/:action  (action = approve | reject | delete)
adminController.post("/admin/uploads/:id/:action", async (c) => {
  const id = c.req.param("id");
  const action = c.req.param("action");
  if (action === "delete") {
    const user = await requirePermission(c, PERMISSIONS.UPLOADS_DELETE);
    return c.json({ ok: true, ...(await service(c).deleteUpload(id, user.userId)) });
  }
  if (action !== "approve" && action !== "reject") throw Errors.badRequest("Invalid action.");
  const user = await requirePermission(c, PERMISSIONS.UPLOADS_MODERATE);
  return c.json({ ok: true, ...(await service(c).moderate(id, action, user.userId)) });
});

// GET /api/v1/admin/uploads/:id/file — stream the file for moderation preview
adminController.get("/admin/uploads/:id/file", async (c) => {
  await requirePermission(c, PERMISSIONS.UPLOADS_MODERATE);
  const f = await service(c).getFile(c.req.param("id"));
  const disp = c.req.query("download") ? "attachment" : "inline";
  const name = f.filename.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "'");
  return c.body(f.body, 200, {
    "Content-Type": f.mime || "application/octet-stream",
    "Content-Disposition": `${disp}; filename="${name}"`,
  });
});

// POST /api/v1/admin/uploads/:id  { course?, section?, filename? } — edit an upload's metadata
adminController.post("/admin/uploads/:id", async (c) => {
  const user = await requirePermission(c, PERMISSIONS.UPLOADS_MODERATE);
  const body = (await c.req.json()) as { course?: string | null; section?: string | null; filename?: string };
  return c.json({ ok: true, ...(await service(c).editUpload(c.req.param("id"), body, user.userId)) });
});

// GET /api/v1/admin/files — all student uploads (archive files are read client-side from the bundle)
adminController.get("/admin/files", async (c) => {
  await requirePermission(c, PERMISSIONS.UPLOADS_MODERATE);
  return c.json({ uploads: await service(c).listFiles() });
});

// POST /api/v1/admin/files/override  { p, hidden?, name?, course?, section?, size? } — edit/delete a static archive file
adminController.post("/admin/files/override", async (c) => {
  const user = await requirePermission(c, PERMISSIONS.UPLOADS_DELETE);
  const body = (await c.req.json()) as {
    p?: string;
    hidden?: boolean;
    name?: string | null;
    course?: string | null;
    section?: string | null;
    size?: number | null;
  };
  if (!body.p) throw Errors.badRequest("Missing file path.");
  const { p, ...patch } = body;
  return c.json({ ok: true, ...(await service(c).setOverride(p, patch, user.userId)) });
});

// GET /api/v1/admin/users?q=&status=&limit=&offset= — user management list (paged)
adminController.get("/admin/users", async (c) => {
  await requirePermission(c, PERMISSIONS.USERS_VERIFY);
  return c.json(
    await service(c).users({
      q: c.req.query("q") || undefined,
      status: c.req.query("status") || undefined,
      limit: intQuery(c, "limit", 50, 100),
      offset: intQuery(c, "offset", 0, 100_000),
    }),
  );
});

// POST /api/v1/admin/users/:id/role  { role } — change a user's role (super admin)
adminController.post("/admin/users/:id/role", async (c) => {
  const actor = await requirePermission(c, PERMISSIONS.ROLES_MANAGE);
  const { role } = (await c.req.json()) as { role?: string };
  if (!role || !(ROLE_LADDER as readonly string[]).includes(role)) throw Errors.badRequest("Invalid role.");
  return c.json({ ok: true, ...(await service(c).setRole(c.req.param("id"), role, actor.userId)) });
});

// POST /api/v1/admin/users/:id/status  { status } — suspend / ban / restore
adminController.post("/admin/users/:id/status", async (c) => {
  const actor = await requirePermission(c, PERMISSIONS.USERS_BAN);
  const { status } = (await c.req.json()) as { status?: string };
  if (!status || !USER_STATUSES.includes(status)) throw Errors.badRequest("Invalid status.");
  return c.json({ ok: true, ...(await service(c).setStatus(c.req.param("id"), status, actor.userId)) });
});

// GET /api/v1/admin/audit?limit=&offset= — audit log (paged)
adminController.get("/admin/audit", async (c) => {
  await requirePermission(c, PERMISSIONS.AUDIT_READ);
  return c.json(await service(c).audit(intQuery(c, "limit", 50, 100), intQuery(c, "offset", 0, 100_000)));
});
