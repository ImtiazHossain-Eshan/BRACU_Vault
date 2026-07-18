import { courses, type CategoryId } from "./data";
import {
  RESOURCE_TYPES,
  SEMESTERS,
  type CourseDetail,
  type CourseSummary,
  type FileFormat,
  type ResourceType,
  type VaultFile,
} from "./types";

/* ----------------------------------------------------------------------------
 * Deterministic dataset. Files are generated from a seeded RNG keyed on the
 * course code, so the catalogue is stable across SSR/CSR and rebuilds — no
 * hydration drift — while still feeling rich and varied.
 * -------------------------------------------------------------------------- */

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const META: Record<CategoryId, { topics: string[]; tags: string[] }> = {
  core: {
    topics: ["Recursion", "Graphs", "Dynamic Programming", "Pointers", "Concurrency", "Indexing", "Normalization", "Routing", "Inheritance", "Scheduling"],
    tags: ["algorithms", "data-structures", "systems", "oop", "databases"],
  },
  electives: {
    topics: ["Convolution", "Tokenization", "Embeddings", "Segmentation", "Protocols", "Regression"],
    tags: ["ml", "nlp", "vision", "networks", "data-science"],
  },
  math: {
    topics: ["Limits", "Integration", "Eigenvalues", "Probability", "Vectors", "Series"],
    tags: ["calculus", "linear-algebra", "statistics", "physics"],
  },
  gened: {
    topics: ["Composition", "Ethics", "Microeconomics", "Civilization", "Anthropology"],
    tags: ["writing", "society", "humanities", "business"],
  },
};

function counts(category: CategoryId, rng: () => number): Record<ResourceType, number> {
  const base: Record<ResourceType, number> = {
    Notes: 3 + Math.floor(rng() * 4),
    Slides: 2 + Math.floor(rng() * 4),
    Assignments: Math.floor(rng() * 4),
    Questions: 2 + Math.floor(rng() * 6),
    Solutions: Math.floor(rng() * 3),
    Projects: Math.floor(rng() * 3),
  };
  if (category === "core") {
    base.Projects += 1;
    base.Assignments += 1;
  }
  if (category === "math") {
    base.Notes += 2;
    base.Projects = Math.max(0, base.Projects - 1);
  }
  if (category === "gened") base.Slides += 1;
  return base;
}

function makeTitle(
  type: ResourceType,
  n: number,
  topic: string,
  sem: string,
  year: number,
  rng: () => number
): string {
  switch (type) {
    case "Notes":
      return rng() < 0.5 ? `Lecture ${n} · ${topic}` : `${topic} · Notes`;
    case "Slides":
      return rng() < 0.5 ? `Week ${n} Slides` : `${topic} Slides`;
    case "Assignments":
      return `Assignment ${n} · ${topic}`;
    case "Questions":
      return `${sem} ${year} ${rng() < 0.5 ? "Midterm" : "Final"}`;
    case "Solutions":
      return rng() < 0.5 ? `Lab ${n} Solution` : `Assignment ${n} Solution`;
    case "Projects":
      return `Project · ${topic}`;
  }
}

function pickFormat(type: ResourceType, rng: () => number): FileFormat {
  switch (type) {
    case "Slides":
      return "pptx";
    case "Questions":
      return "pdf";
    case "Notes":
      return rng() < 0.82 ? "pdf" : "ipynb";
    case "Assignments":
      return rng() < 0.6 ? "pdf" : "docx";
    case "Solutions":
      return rng() < 0.6 ? "ipynb" : "code";
    case "Projects":
      return rng() < 0.6 ? "zip" : "code";
  }
}

function sizeFor(fmt: FileFormat, rng: () => number): string {
  const mb = (lo: number, hi: number) => (lo + rng() * (hi - lo)).toFixed(1) + " MB";
  const kb = (lo: number, hi: number) => Math.round(lo + rng() * (hi - lo)) + " KB";
  switch (fmt) {
    case "pptx":
      return mb(2, 24);
    case "pdf":
      return rng() < 0.5 ? kb(180, 980) : mb(1, 8);
    case "zip":
      return mb(5, 60);
    case "ipynb":
      return kb(40, 800);
    case "docx":
      return kb(60, 700);
    case "code":
      return kb(2, 120);
  }
}

function buildFiles(code: string, courseTitle: string, category: CategoryId): VaultFile[] {
  const rng = mulberry32(hash(code));
  const meta = META[category];
  const plan = counts(category, rng);
  const files: VaultFile[] = [];

  for (const type of RESOURCE_TYPES) {
    const n = plan[type];
    for (let i = 0; i < n; i++) {
      const sem = SEMESTERS[Math.floor(rng() * SEMESTERS.length)];
      const year = 2021 + Math.floor(rng() * 4);
      const topic = meta.topics[Math.floor(rng() * meta.topics.length)];
      const title = makeTitle(type, i + 1, topic, sem, year, rng);
      const format = pickFormat(type, rng);
      const tags = Array.from(
        new Set([
          type.toLowerCase(),
          topic.toLowerCase().replace(/\s+/g, "-"),
          meta.tags[Math.floor(rng() * meta.tags.length)],
        ])
      );
      files.push({
        id: `${code}-${type}-${i + 1}`.replace(/\s+/g, ""),
        title,
        course: code,
        courseTitle,
        category,
        type,
        semester: sem,
        year,
        format,
        tags,
        size: sizeFor(format, rng),
        popularity: Math.floor(rng() * 100),
      });
    }
  }
  return files.sort((a, b) => b.popularity - a.popularity);
}

const details: CourseDetail[] = courses.map((c) => {
  const files = buildFiles(c.code, c.title, c.category);
  const courseCounts = RESOURCE_TYPES.reduce(
    (acc, t) => {
      acc[t] = files.filter((f) => f.type === t).length;
      return acc;
    },
    {} as Record<ResourceType, number>
  );
  return {
    code: c.code,
    title: c.title,
    category: c.category,
    files,
    counts: courseCounts,
    fileCount: files.length,
  };
});

export const courseDetails: CourseDetail[] = details;
export const allFiles: VaultFile[] = details.flatMap((c) => c.files);
export const totalFiles = allFiles.length;

export const courseSummaries: CourseSummary[] = details.map(
  ({ files: _files, ...rest }) => rest
);

const slugNorm = (s: string) => s.toLowerCase().replace(/[\s-]+/g, "");

export function getCourse(code: string): CourseDetail | null {
  const target = slugNorm(code);
  return details.find((c) => slugNorm(c.code) === target) ?? null;
}

/** Clean URL for a course, e.g. "CSE 221" → "/course/CSE-221". */
export const courseHref = (code: string) =>
  `/course/${code.replace(/\s+/g, "-")}`;

export function getFileById(id: string): VaultFile | null {
  return allFiles.find((f) => f.id === id) ?? null;
}
