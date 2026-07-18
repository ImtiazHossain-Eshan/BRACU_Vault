import indexRaw from "@/data/vault-index.json";
import { kindOf, type PreviewKind, type VaultResource } from "./preview-utils";

/** Server-only: the scanned vault index + filtering. Do not import from client
 *  components (it would ship the whole index) — use the /api/resources route. */
// Course codes are displayed without spaces (e.g. "CSE221"). The on-disk path
// (`p`) keeps its real spaces — it's the source of truth for the file API.
export const allResources: VaultResource[] = (indexRaw as VaultResource[]).map(
  (f) => ({ ...f, course: f.course.replace(/\s+/g, "") })
);

export interface ResourceQuery {
  q?: string;
  category?: string;
  course?: string;
  kind?: PreviewKind | "all";
}

export function filterResources(query: ResourceQuery): VaultResource[] {
  const { q = "", category = "all", course = "", kind = "all" } = query;
  let res = allResources;
  if (category !== "all") res = res.filter((f) => f.category === category);
  if (course) res = res.filter((f) => f.course === course);
  if (kind !== "all") res = res.filter((f) => kindOf(f.ext) === kind);
  const ql = q.trim().toLowerCase();
  if (ql) {
    res = res.filter(
      (f) =>
        f.name.toLowerCase().includes(ql) ||
        f.course.toLowerCase().includes(ql) ||
        f.section.toLowerCase().includes(ql)
    );
  }
  return res;
}

const norm = (s: string) => s.toLowerCase().replace(/[\s-]+/g, "");

/** Real vault files for a single course (matches "CSE 370" or "CSE-370"). */
export function resourcesForCourse(code: string): VaultResource[] {
  const t = norm(code);
  return allResources.filter((f) => norm(f.course) === t);
}

export interface CourseResourceSummary {
  course: string;
  category: string;
  count: number;
}

export function courseSummaries(): CourseResourceSummary[] {
  const map = new Map<string, CourseResourceSummary>();
  for (const f of allResources) {
    if (!f.course) continue;
    const e = map.get(f.course) ?? {
      course: f.course,
      category: f.category,
      count: 0,
    };
    e.count++;
    map.set(f.course, e);
  }
  return [...map.values()].sort((a, b) => a.course.localeCompare(b.course));
}
