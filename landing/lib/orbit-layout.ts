import { categories } from "./data";
import type { CategoryId } from "./types";
import { courseDetails } from "./vault-data";

/* ----------------------------------------------------------------------------
 * Orbit layout algorithm - shared by the 3D scene and the 2D fallback so both
 * render the exact same structure. Categories become concentric rings (inner =
 * core, outer = electives/GenEd); courses are spaced evenly along each ring.
 * -------------------------------------------------------------------------- */

const RING_ORDER: CategoryId[] = ["core", "math", "electives", "gened"];

const RING_RADIUS: Record<CategoryId, number> = {
  core: 3.8,
  math: 6.0,
  electives: 7.9,
  gened: 9.6,
};

// Fixed metallic palette - reads well over both the Paper and Dark Archive themes.
const RING_COLOR: Record<CategoryId, string> = {
  core: "#C17A2B",
  math: "#6F7A52",
  electives: "#A0633D",
  gened: "#C2A878",
};

export interface OrbitNode {
  code: string;
  title: string;
  category: CategoryId;
  fileCount: number;
  tags: string[];
  ringIndex: number;
  radius: number;
  angle: number;
  color: string;
  /** unit-plane coordinates (XZ in 3D, XY in 2D) */
  x: number;
  z: number;
}

export interface OrbitRing {
  category: CategoryId;
  label: string;
  radius: number;
  color: string;
  count: number;
}

export interface OrbitData {
  rings: OrbitRing[];
  nodes: OrbitNode[];
  maxRadius: number;
}

export function buildOrbit(): OrbitData {
  const rings: OrbitRing[] = [];
  const nodes: OrbitNode[] = [];

  RING_ORDER.forEach((cat, ringIndex) => {
    const list = courseDetails.filter((c) => c.category === cat);
    const radius = RING_RADIUS[cat];
    const color = RING_COLOR[cat];
    const label = categories.find((c) => c.id === cat)?.label ?? cat;
    rings.push({ category: cat, label, radius, color, count: list.length });

    const n = Math.max(1, list.length);
    list.forEach((c, i) => {
      const angle = (i / n) * Math.PI * 2 + ringIndex * 0.5;
      const tagCounts = new Map<string, number>();
      for (const f of c.files)
        for (const t of f.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
      const tags = [...tagCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map((e) => e[0]);

      nodes.push({
        code: c.code,
        title: c.title,
        category: cat,
        fileCount: c.fileCount,
        tags,
        ringIndex,
        radius,
        angle,
        color,
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
      });
    });
  });

  return { rings, nodes, maxRadius: RING_RADIUS.gened };
}
