#!/usr/bin/env node
/**
 * Upload the vault archive + the pre-converted PDF cache to Cloudflare R2.
 * R2 is S3-compatible, so this uses @aws-sdk/client-s3 (no rclone needed).
 *
 *   R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... node scripts/upload-r2.mjs
 *
 * Only the files the app actually references are uploaded:
 *   - the 1,061 entries in landing/data/vault-index.json  -> bucket key <p>
 *   - landing/.pdf-cache/<path>.pdf                         -> key __pdf__/<path>.pdf
 * (matches fileUrl() and officePdfUrl() in the landing app).
 */
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createReadStream, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const ACCESS = process.env.R2_ACCESS_KEY_ID;
const SECRET = process.env.R2_SECRET_ACCESS_KEY;
const ACCOUNT = process.env.R2_ACCOUNT_ID || "2f2ceab58633fe8413e356a80cb463e7";
const BUCKET = process.env.R2_BUCKET || "bracu-vault-files";
if (!ACCESS || !SECRET) {
  console.error("Set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY env vars.");
  process.exit(1);
}

const VAULT = "A:\\BRACU Vault";
const PDF_CACHE = "A:\\bracu-vault\\landing\\.pdf-cache";
const INDEX = "A:\\bracu-vault\\landing\\data\\vault-index.json";
const CONCURRENCY = 8;

const MIME = {
  pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", webp: "image/webp", svg: "image/svg+xml",
  txt: "text/plain; charset=utf-8", md: "text/plain; charset=utf-8",
  py: "text/plain; charset=utf-8", c: "text/plain; charset=utf-8", cpp: "text/plain; charset=utf-8",
  cc: "text/plain; charset=utf-8", h: "text/plain; charset=utf-8", hpp: "text/plain; charset=utf-8",
  java: "text/plain; charset=utf-8", asm: "text/plain; charset=utf-8", sql: "text/plain; charset=utf-8",
  csv: "text/csv; charset=utf-8", json: "application/json", ipynb: "application/json",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  doc: "application/msword", ppt: "application/vnd.ms-powerpoint", xls: "application/vnd.ms-excel",
  zip: "application/zip",
};

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS, secretAccessKey: SECRET },
});

/** [{ key, fp, size }] */
function fromIndex() {
  const rows = JSON.parse(readFileSync(INDEX, "utf8"));
  const out = [];
  for (const r of rows) {
    const fp = join(VAULT, ...String(r.p).split("/"));
    try { const st = statSync(fp); if (st.isFile()) out.push({ key: r.p, fp, size: st.size }); }
    catch { /* not on disk, skip */ }
  }
  return out;
}

function fromDir(root, prefix) {
  const out = [];
  (function walk(dir) {
    for (const name of readdirSync(dir)) {
      const fp = join(dir, name);
      let st; try { st = statSync(fp); } catch { continue; }
      if (st.isDirectory()) walk(fp);
      else out.push({ key: `${prefix}/${relative(root, fp).split("\\").join("/")}`, fp, size: st.size });
    }
  })(root);
  return out;
}

async function upload(files, label) {
  const total = files.length;
  let done = 0, failed = 0, skipped = 0, idx = 0;
  async function worker() {
    while (idx < files.length) {
      const { key, fp, size } = files[idx++];
      // Skip if already uploaded (makes re-runs cheap / resumable).
      try { await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key })); skipped++; continue; } catch { /* not found */ }
      const ext = extname(fp).slice(1).toLowerCase();
      try {
        await s3.send(new PutObjectCommand({
          Bucket: BUCKET, Key: key, Body: createReadStream(fp),
          ContentLength: size, ContentType: MIME[ext] || "application/octet-stream",
        }));
        done++;
        if (done % 20 === 0 || done === total) process.stdout.write(`\r  ${label}: ${done}/${total} (${failed} failed)   `);
      } catch (e) {
        failed++;
        console.error(`\n  FAIL ${key}: ${e.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`\n  ${label}: uploaded ${done}, skipped ${skipped}, failed ${failed} of ${total}`);
}

console.log(`Uploading to R2 bucket "${BUCKET}"...`);
await upload(fromIndex(), "vault archive");
await upload(fromDir(PDF_CACHE, "__pdf__"), "pdf cache");
console.log("Done.");
