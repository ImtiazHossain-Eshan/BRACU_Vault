import type { CategoryId, ResourceType, Semester, VaultFile } from "./types";
import { fuzzyScore } from "./search";

export type SortKey = "relevance" | "popular" | "newest" | "az";

export interface Query {
  q?: string;
  type?: ResourceType | "all";
  semester?: Semester | "all";
  category?: CategoryId | "all";
  course?: string;
  sort?: SortKey;
}

export function queryFiles(files: VaultFile[], query: Query): VaultFile[] {
  const {
    q = "",
    type = "all",
    semester = "all",
    category = "all",
    course,
    sort = "relevance",
  } = query;

  let res = files.filter(
    (f) =>
      (type === "all" || f.type === type) &&
      (semester === "all" || f.semester === semester) &&
      (category === "all" || f.category === category) &&
      (!course || f.course === course)
  );

  const ql = q.trim();
  if (ql) {
    res = res
      .map((f) => ({
        f,
        s: Math.max(
          fuzzyScore(ql, f.title),
          fuzzyScore(ql, f.course) + 2,
          fuzzyScore(ql, f.courseTitle),
          fuzzyScore(ql, f.tags.join(" "))
        ),
      }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.f);
    if (sort !== "relevance") res = applySort(res, sort);
  } else {
    res = applySort(res, sort === "relevance" ? "popular" : sort);
  }
  return res;
}

function applySort(files: VaultFile[], sort: SortKey): VaultFile[] {
  const c = [...files];
  if (sort === "popular") c.sort((a, b) => b.popularity - a.popularity);
  else if (sort === "newest")
    c.sort((a, b) => b.year - a.year || b.popularity - a.popularity);
  else if (sort === "az") c.sort((a, b) => a.title.localeCompare(b.title));
  return c;
}

export interface Slice {
  key: string;
  count: number;
}

export function distributionByType(files: VaultFile[]): Slice[] {
  const map = new Map<string, number>();
  for (const f of files) map.set(f.type, (map.get(f.type) ?? 0) + 1);
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

export function distributionBySemester(files: VaultFile[]): Slice[] {
  const map = new Map<string, number>();
  for (const f of files) map.set(f.semester, (map.get(f.semester) ?? 0) + 1);
  return [...map.entries()].map(([key, count]) => ({ key, count }));
}

/** Recommend popular, unseen files from the categories the user has been exploring. */
export function recommend(
  all: VaultFile[],
  recentCourses: string[],
  bookmarks: string[],
  n = 6
): VaultFile[] {
  const seen = new Set(bookmarks);
  const recentCats = new Set(
    all.filter((f) => recentCourses.includes(f.course)).map((f) => f.category)
  );
  const pool = all
    .filter((f) => !seen.has(f.id) && !recentCourses.includes(f.course))
    .filter((f) => (recentCats.size ? recentCats.has(f.category) : true))
    .sort((a, b) => b.popularity - a.popularity);

  // diversify: at most 2 per course
  const perCourse = new Map<string, number>();
  const out: VaultFile[] = [];
  for (const f of pool) {
    const c = perCourse.get(f.course) ?? 0;
    if (c >= 2) continue;
    perCourse.set(f.course, c + 1);
    out.push(f);
    if (out.length >= n) break;
  }
  return out;
}
