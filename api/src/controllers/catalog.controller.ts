import { Hono } from "hono";
import type { AppEnv } from "../env";
import { getDb } from "../db/client";
import { UploadRepository } from "../repositories/upload.repository";
import { OverrideRepository } from "../repositories/override.repository";

/** Public catalog reads (no auth). Approved student uploads are exposed here so
 *  the course browser can merge them into its file tree alongside the archive. */
export const catalogController = new Hono<AppEnv>();

const norm = (s: string) => s.toLowerCase().replace(/[\s-]+/g, "");

// GET /api/v1/catalog/uploads?course=CSE260 — approved uploads for one course,
// shaped like a VaultResource (p is the public files-bucket key).
catalogController.get("/catalog/uploads", async (c) => {
  const course = (c.req.query("course") ?? "").trim();
  if (!course) return c.json({ uploads: [] });

  const target = norm(course);
  const rows = await new UploadRepository(getDb(c.env)).listApproved();

  const uploads = rows
    .filter((r) => r.publicKey && r.course && norm(r.course) === target)
    .map((r) => ({
      id: r.id,
      p: r.publicKey!,
      name: r.filename,
      ext: r.filename.split(".").pop()?.toLowerCase() ?? "",
      size: r.size,
      course: r.course ?? "",
      section: r.section ?? "",
      category: r.category ?? "",
      community: true as const,
    }));

  return c.json({ uploads });
});

// GET /api/v1/catalog/overrides — admin edits/deletes of the static archive files,
// applied client-side so the (static) catalog reflects them without a rebuild.
catalogController.get("/catalog/overrides", async (c) => {
  const rows = await new OverrideRepository(getDb(c.env)).all();
  return c.json({
    overrides: rows.map((o) => ({
      p: o.p,
      hidden: o.hidden,
      name: o.name,
      course: o.course,
      section: o.section,
      size: o.size,
    })),
  });
});
