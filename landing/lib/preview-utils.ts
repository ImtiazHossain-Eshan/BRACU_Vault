/** Pure, client-safe helpers for the preview system (no fs / no JSON import). */

export interface VaultResource {
  p: string; // relative path inside the vault, "/"-separated
  name: string;
  ext: string;
  size: number;
  category: string;
  course: string;
  section: string;
  /** True for student-contributed uploads (served from the public bucket). */
  community?: boolean;
  /** Upload id, present only for community files. */
  id?: string;
}

export type PreviewKind =
  | "pdf"
  | "code"
  | "text"
  | "notebook"
  | "image"
  | "office"
  | "unsupported";

const CODE = new Set([
  "py", "cpp", "c", "h", "hpp", "cc", "js", "ts", "jsx", "tsx", "java",
  "asm", "sql", "html", "css", "json", "csv",
]);
const TEXT = new Set(["txt", "md"]);
const IMAGE = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg"]);
const OFFICE = new Set(["docx", "doc", "pptx", "ppt", "xlsx", "xls"]);

export function kindOf(ext: string): PreviewKind {
  const e = ext.toLowerCase();
  if (e === "pdf") return "pdf";
  if (e === "ipynb") return "notebook";
  if (CODE.has(e)) return "code";
  if (TEXT.has(e)) return "text";
  if (IMAGE.has(e)) return "image";
  if (OFFICE.has(e)) return "office";
  return "unsupported";
}

const LANG: Record<string, string> = {
  py: "python", cpp: "cpp", cc: "cpp", c: "c", h: "cpp", hpp: "cpp",
  js: "javascript", jsx: "jsx", ts: "typescript", tsx: "tsx",
  java: "java", sql: "sql", html: "html", css: "css", json: "json",
  asm: "asm", csv: "csv", md: "markdown", txt: "plaintext",
};

export function langOf(ext: string): string {
  return LANG[ext.toLowerCase()] ?? "plaintext";
}

export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** In production, files are served from R2 (set NEXT_PUBLIC_FILES_BASE_URL, e.g.
 *  https://files.bracuvault.me). In dev it's unset → the local /api/file route. */
const FILES_BASE = (process.env.NEXT_PUBLIC_FILES_BASE_URL ?? "").replace(/\/$/, "");
const r2 = (path: string) => `${FILES_BASE}/${path.split("/").map(encodeURIComponent).join("/")}`;

export function fileUrl(p: string, download = false): string {
  if (FILES_BASE) return r2(p);
  return `/api/file?p=${encodeURIComponent(p)}${download ? "&download=1" : ""}`;
}

/** URL of the pre-converted PDF for an office file (full-fidelity preview via
 *  pdf.js). In prod the cache lives under the `__pdf__/` prefix on R2. */
export function officePdfUrl(p: string): string {
  if (FILES_BASE) return r2(`__pdf__/${p}.pdf`);
  return `/api/file?p=${encodeURIComponent(p)}&pdf=1`;
}
