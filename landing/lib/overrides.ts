"use client";

import type { VaultResource } from "./preview-utils";

/** Admin overrides for the static archive files, applied client-side so the
 *  (statically-exported) catalog reflects admin edits/deletes without a rebuild. */

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8787").replace(/\/$/, "");

export interface FileOverride {
  p: string;
  hidden: boolean;
  name: string | null;
  course: string | null;
  section: string | null;
  size: number | null;
}

let cache: Promise<FileOverride[]> | null = null;

/** Fetch overrides once per session (cached). Fails soft to []. */
export function fetchOverrides(): Promise<FileOverride[]> {
  if (!cache) {
    cache = fetch(`${API_BASE}/api/v1/catalog/overrides`)
      .then((r) => (r.ok ? r.json() : { overrides: [] }))
      .then((d: { overrides?: FileOverride[] }) => d.overrides ?? [])
      .catch(() => []);
  }
  return cache;
}

const norm = (s: string) => s.toLowerCase().replace(/[\s-]+/g, "");
const extOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

/** Apply overrides to a static archive list: drop hidden files and files re-filed
 *  to another course (when `currentCourse` is given), and apply name/course/section/size edits. */
export function applyOverrides(
  files: VaultResource[],
  overrides: FileOverride[],
  currentCourse?: string,
): VaultResource[] {
  if (!overrides.length) return files;
  const byP = new Map(overrides.map((o) => [o.p, o]));
  const out: VaultResource[] = [];
  for (const f of files) {
    const o = byP.get(f.p);
    if (!o) {
      out.push(f);
      continue;
    }
    if (o.hidden) continue;
    if (currentCourse && o.course && norm(o.course) !== norm(currentCourse)) continue; // moved away
    out.push({
      ...f,
      name: o.name ?? f.name,
      course: o.course ?? f.course,
      section: o.section ?? f.section,
      size: o.size ?? f.size,
    });
  }
  return out;
}

/** Archive files an admin re-filed INTO `code` (course reassigned), which the
 *  course's own static list doesn't contain. */
export function injectedForCourse(
  code: string,
  overrides: FileOverride[],
  existing: Set<string>,
): VaultResource[] {
  const t = norm(code);
  const out: VaultResource[] = [];
  for (const o of overrides) {
    if (o.hidden || !o.course || norm(o.course) !== t || existing.has(o.p)) continue;
    const name = o.name ?? o.p.split("/").pop() ?? o.p;
    out.push({
      p: o.p,
      name,
      ext: extOf(name),
      size: o.size ?? 0,
      category: "core",
      course: o.course,
      section: o.section ?? "",
    });
  }
  return out;
}
