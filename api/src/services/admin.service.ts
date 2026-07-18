import type { Env } from "../env";
import type { Db } from "../db/client";
import { Errors } from "../lib/respond";
import { AdminRepository } from "../repositories/admin.repository";
import { OverrideRepository } from "../repositories/override.repository";

const safeName = (name: string) => name.replace(/[^\w.\- ]+/g, "_").slice(0, 120);
// ASCII-only, quote-free filename for HTTP headers.
const headerSafe = (name: string) => name.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "'").slice(0, 120);

/** Admin/moderation business logic. Authorization is enforced at the controller
 *  via requirePermission — this layer assumes the caller is already allowed. */
export class AdminService {
  private readonly repo: AdminRepository;
  private readonly overrides: OverrideRepository;

  constructor(
    private readonly env: Env,
    db: Db,
  ) {
    this.repo = new AdminRepository(db);
    this.overrides = new OverrideRepository(db);
  }

  overview() {
    return this.repo.overview();
  }

  /** Moderation queue page. Fetches limit+1 to report whether more pages exist. */
  async queue(status = "pending", limit = 30, offset = 0) {
    const rows = await this.repo.uploadsByStatus(status, limit + 1, offset);
    return { uploads: rows.slice(0, limit), hasMore: rows.length > limit };
  }

  async moderate(uploadId: string, action: "approve" | "reject", actorId: string) {
    const up = await this.repo.getUpload(uploadId);
    if (!up) throw Errors.notFound("Upload not found.");

    if (action === "approve") {
      // Publish: copy the bytes into the public files bucket so the file serves
      // from files.bracuvault.me exactly like the rest of the archive.
      const obj = await this.env.bracu_vault_uploads.get(up.r2Key);
      if (!obj) throw Errors.notFound("Stored file is missing.");
      const publicKey = `community/${up.id}/${safeName(up.filename)}`;
      await this.env.bracu_vault_files.put(publicKey, await obj.arrayBuffer(), {
        httpMetadata: {
          contentType: up.mime || obj.httpMetadata?.contentType || "application/octet-stream",
          // Direct navigation downloads instead of rendering in the browser
          // (defense-in-depth for user-contributed content). In-page previews
          // (pdf.js, <img>) fetch the bytes and are unaffected.
          contentDisposition: `attachment; filename="${headerSafe(up.filename)}"`,
        },
      });
      await this.repo.setUploadStatus(up.id, "approved", actorId, publicKey);
      return { id: up.id, status: "approved" };
    }

    // Reject: unpublish any previously published copy, then flip status.
    if (up.publicKey) {
      try {
        await this.env.bracu_vault_files.delete(up.publicKey);
      } catch {
        /* already gone */
      }
    }
    await this.repo.setUploadStatus(up.id, "rejected", actorId, null);
    return { id: up.id, status: "rejected" };
  }

  /** Every student upload, for the admin file manager. */
  listFiles() {
    return this.repo.listAllUploads();
  }

  /** Stream an upload's bytes from the private bucket (admin preview). */
  async getFile(uploadId: string) {
    const up = await this.repo.getUpload(uploadId);
    if (!up) throw Errors.notFound("Upload not found.");
    const obj = await this.env.bracu_vault_uploads.get(up.r2Key);
    if (!obj) throw Errors.notFound("Stored file is missing.");
    return { filename: up.filename, mime: up.mime, body: obj.body };
  }

  /** Remove a student upload: delete its bytes (public + private) and soft-delete the row. */
  async deleteUpload(uploadId: string, actorId: string) {
    const up = await this.repo.getUpload(uploadId);
    if (!up) throw Errors.notFound("Upload not found.");
    if (up.publicKey) {
      try { await this.env.bracu_vault_files.delete(up.publicKey); } catch { /* gone */ }
    }
    if (up.r2Key) {
      try { await this.env.bracu_vault_uploads.delete(up.r2Key); } catch { /* gone */ }
    }
    await this.repo.softDeleteUpload(up.id, actorId);
    return { id: up.id, deleted: true };
  }

  /** Edit a student upload's course / folder / display name. */
  async editUpload(
    uploadId: string,
    meta: { course?: string | null; section?: string | null; filename?: string },
    actorId: string,
  ) {
    const ok = await this.repo.updateUploadMeta(uploadId, meta, actorId);
    if (!ok) throw Errors.notFound("Upload not found.");
    return { id: uploadId };
  }

  /** Hide (delete) or re-file/rename a STATIC archive file via an override. */
  async setOverride(
    p: string,
    patch: { hidden?: boolean; name?: string | null; course?: string | null; section?: string | null; size?: number | null },
    actorId: string,
  ) {
    await this.overrides.set(p, patch, actorId);
    await this.repo.writeAudit("file.override", "file", p, patch, actorId);
    return { p };
  }

  async users(opts: { q?: string; status?: string; limit?: number; offset?: number }) {
    const limit = opts.limit ?? 50;
    const rows = await this.repo.listUsers({ ...opts, limit: limit + 1, offset: opts.offset ?? 0 });
    return { users: rows.slice(0, limit), hasMore: rows.length > limit };
  }

  async setRole(userId: string, role: string, actorId: string) {
    if (!(await this.repo.setUserRole(userId, role, actorId))) throw Errors.notFound("User not found.");
    return { id: userId, role };
  }

  async setStatus(userId: string, status: string, actorId: string) {
    if (!(await this.repo.setUserStatus(userId, status, actorId))) throw Errors.notFound("User not found.");
    return { id: userId, status };
  }

  async audit(limit = 50, offset = 0) {
    const rows = await this.repo.listAudit(limit + 1, offset);
    return { entries: rows.slice(0, limit), hasMore: rows.length > limit };
  }
}
