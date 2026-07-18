import { readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, extname, sep } from "node:path";

const ROOT = "A:\\BRACU Vault";

// Vendor / noise directories to skip entirely (e.g. bundled PyOpenGL).
const SKIP_DIRS = new Set([
  ".git", "node_modules", "__pycache__", ".idea", ".vscode",
  "OpenGL", "DLLS", "raw", "GL", "site-packages", "venv", "env", ".next",
]);

// Only previewable / meaningful types.
const ALLOW = new Set([
  "pdf", "ipynb", "py", "cpp", "c", "h", "hpp", "cc", "js", "ts", "jsx", "tsx",
  "java", "txt", "md", "csv", "json", "asm", "sql", "html", "css",
  "docx", "doc", "pptx", "ppt", "xlsx", "xls",
  "png", "jpg", "jpeg", "gif", "webp", "svg",
]);

const catOf = (seg) =>
  /^1\./.test(seg) ? "core"
  : /^2\./.test(seg) ? "electives"
  : /^3\./.test(seg) ? "math"
  : /^4\./.test(seg) ? "gened"
  : "other";

const COURSE_RE = /^[A-Z]{2,4}\s*\d{3}[A-Z]?$/;

const out = [];
function walk(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(join(dir, e.name));
    } else {
      const ext = extname(e.name).toLowerCase().slice(1);
      if (!ALLOW.has(ext)) continue;
      const full = join(dir, e.name);
      let size = 0;
      try { size = statSync(full).size; } catch {}
      const rel = full.slice(ROOT.length + 1).split(sep).join("/");
      const segs = rel.split("/");
      const category = catOf(segs[0] || "");
      const course = segs.find((s) => COURSE_RE.test(s)) || segs[1] || "";
      const ci = course ? segs.indexOf(course) : 0;
      const section = segs.slice(ci + 1, segs.length - 1).join(" / ");
      out.push({ p: rel, name: e.name, ext, size, category, course, section });
    }
  }
}

walk(ROOT);
out.sort((a, b) => a.course.localeCompare(b.course) || a.name.localeCompare(b.name));

mkdirSync("data", { recursive: true });
writeFileSync("data/vault-index.json", JSON.stringify(out));

const byExt = {};
for (const f of out) byExt[f.ext] = (byExt[f.ext] || 0) + 1;
const courses = new Set(out.map((f) => f.course).filter(Boolean));
console.log("indexed", out.length, "files across", courses.size, "courses");
console.log("by ext:", JSON.stringify(byExt));
