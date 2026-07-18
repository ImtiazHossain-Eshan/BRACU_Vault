import type { Env } from "../env";
import type { Db } from "../db/client";
import { Errors } from "../lib/respond";
import { sha256BytesHex, uuid } from "../lib/crypto";
import { UploadRepository, type UploadRow } from "../repositories/upload.repository";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
// Per-user daily abuse limits (rolling 24h window).
const MAX_FILES_PER_DAY = 20;
const MAX_BYTES_PER_DAY = 150 * 1024 * 1024; // 150 MB

/** Academic file types the vault deals in. Validated by extension; the stored
 *  Content-Type comes from the upload. (No archives: zip is a malware vector
 *  we can't inspect, and published files are world-downloadable.) */
const ALLOWED_EXT = new Set([
  "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx",
  "txt", "md", "ipynb", "csv",
  "py", "c", "cpp", "h", "hpp", "java", "js", "ts", "sql",
  "png", "jpg", "jpeg",
]);

const extOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";
const safeName = (name: string) => name.replace(/[^\w.\- ]+/g, "_").slice(0, 120);

export interface UploadInput {
  userId: string;
  file: File;
  course?: string | null;
  category?: string | null;
  section?: string | null;
}

export class UploadService {
  private readonly repo: UploadRepository;

  constructor(
    private readonly env: Env,
    db: Db,
  ) {
    this.repo = new UploadRepository(db);
  }

  /** Validate, store bytes in R2, and record the (pending) upload row. */
  async create(input: UploadInput): Promise<UploadRow> {
    const { file } = input;
    if (file.size === 0) throw Errors.badRequest("That file is empty.");
    if (file.size > MAX_BYTES) throw Errors.badRequest("File exceeds the 25 MB limit.");

    const ext = extOf(file.name);
    if (!ALLOWED_EXT.has(ext)) throw Errors.badRequest(`Unsupported file type: .${ext}`);

    // Daily quota (rolling 24h): caps both file count and total bytes.
    const recent = await this.repo.recentSizes(input.userId, Math.floor(Date.now() / 1000) - 86400);
    if (recent.length >= MAX_FILES_PER_DAY) {
      throw Errors.tooMany("Daily upload limit reached (20 files). Try again tomorrow.");
    }
    if (recent.reduce((a, b) => a + b, 0) + file.size > MAX_BYTES_PER_DAY) {
      throw Errors.tooMany("Daily upload limit reached (150 MB). Try again tomorrow.");
    }

    const bytes = await file.arrayBuffer();
    const sha = await sha256BytesHex(bytes);
    if (await this.repo.hasDuplicate(input.userId, sha)) {
      throw Errors.conflict("You've already uploaded this exact file.");
    }
    const key = `uploads/${input.userId}/${uuid()}-${safeName(file.name)}`;

    await this.env.bracu_vault_uploads.put(key, bytes, {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
    });

    return this.repo.create({
      userId: input.userId,
      r2Key: key,
      filename: file.name,
      mime: file.type || null,
      size: file.size,
      sha256: sha,
      course: input.course ?? null,
      category: input.category ?? null,
      section: input.section ?? null,
    });
  }

  list(userId: string) {
    return this.repo.listByUser(userId);
  }
}
