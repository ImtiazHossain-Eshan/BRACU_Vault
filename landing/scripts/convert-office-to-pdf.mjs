#!/usr/bin/env node
/**
 * Batch-convert the vault's office files (pptx/ppt/docx/doc/xlsx/xls) to PDF so
 * the preview can render them full-fidelity (images + layout) via pdf.js.
 *
 *   npm run convert:pdf
 *
 * Requires LibreOffice (free): https://www.libreoffice.org/download/
 *   winget install -e --id TheDocumentFoundation.LibreOffice
 *
 * Output goes to ./.pdf-cache/<same relative path>.pdf (gitignored). The Next
 * /api/file route serves them at /api/file?p=<path>&pdf=1. Incremental: skips
 * files already converted. Close any open LibreOffice window before running.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, renameSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const VAULT = "A:\\BRACU Vault";
const CACHE = join(__dirname, "..", ".pdf-cache");
const OFFICE = new Set([".pptx", ".ppt", ".docx", ".doc", ".xlsx", ".xls"]);

function findSoffice() {
  const candidates = [
    "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
    "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  return "soffice"; // hope it's on PATH
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const fp = join(dir, name);
    let st;
    try { st = statSync(fp); } catch { continue; }
    if (st.isDirectory()) walk(fp, out);
    else if (OFFICE.has(extname(name).toLowerCase())) out.push(fp);
  }
  return out;
}

const soffice = findSoffice();
try {
  execFileSync(soffice, ["--version"], { stdio: "ignore" });
} catch {
  console.error(
    "\n✖ LibreOffice not found. Install it (free), then re-run `npm run convert:pdf`:\n" +
      "   https://www.libreoffice.org/download/\n" +
      "   winget install -e --id TheDocumentFoundation.LibreOffice\n",
  );
  process.exit(1);
}

const files = walk(VAULT);
console.log(`Found ${files.length} office files. Converting (skipping cached)…`);
let done = 0, skipped = 0, failed = 0;

for (const fp of files) {
  const rel = relative(VAULT, fp);
  const outPdf = join(CACHE, `${rel}.pdf`);
  if (existsSync(outPdf)) { skipped++; continue; }
  const outDir = dirname(outPdf);
  mkdirSync(outDir, { recursive: true });
  try {
    execFileSync(soffice, ["--headless", "--convert-to", "pdf", "--outdir", outDir, fp], {
      stdio: "ignore",
      timeout: 180000,
    });
    // soffice names it <base>.pdf — rename to <originalname>.pdf to avoid collisions.
    const produced = join(outDir, `${basename(fp, extname(fp))}.pdf`);
    if (existsSync(produced) && produced !== outPdf) renameSync(produced, outPdf);
    if (existsSync(outPdf)) {
      done++;
      process.stdout.write(`\r✔ ${done} converted · ${skipped} skipped · ${failed} failed   `);
    } else {
      failed++;
    }
  } catch {
    failed++;
  }
}

console.log(`\nDone. ${done} converted, ${skipped} already cached, ${failed} failed.\nCache: ${CACHE}`);
