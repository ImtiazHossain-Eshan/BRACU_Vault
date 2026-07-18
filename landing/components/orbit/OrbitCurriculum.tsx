"use client";

import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CategoryId } from "@/lib/types";
import { buildOrbit, type OrbitNode } from "@/lib/orbit-layout";
import { courseHref } from "@/lib/vault-data";
import { useWebGL } from "@/hooks/useWebGL";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useDeviceTier } from "@/hooks/useDeviceTier";
import { cn } from "@/lib/cn";
import OrbitSearch from "./OrbitSearch";
import CurriculumSidebar from "./CurriculumSidebar";
import MiniMap from "./MiniMap";
import OrbitDirectory from "./OrbitDirectory";

function SceneLoading() {
  return (
    <div className="grid h-full w-full place-items-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-fg/20 border-t-accent" />
    </div>
  );
}

const OrbitScene = dynamic(() => import("./OrbitScene"), {
  ssr: false,
  loading: () => <SceneLoading />,
});

const ALL_CATS: CategoryId[] = ["core", "math", "electives", "gened"];
const FILE_FILTERS = [
  { v: 0, l: "All" },
  { v: 10, l: "10+" },
  { v: 20, l: "20+" },
];

export default function OrbitCurriculum() {
  const data = useMemo(() => buildOrbit(), []);
  const webgl = useWebGL();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const caps = useDeviceTier();
  const router = useRouter();

  const [selected, setSelected] = useState<OrbitNode | null>(null);
  const [activeCats, setActiveCats] = useState<Set<CategoryId>>(
    () => new Set(ALL_CATS)
  );
  const [minFiles, setMinFiles] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const filtersActive = activeCats.size < ALL_CATS.length || minFiles > 0;
  const passes = (n: OrbitNode) =>
    activeCats.has(n.category) && n.fileCount >= minFiles;

  const filteredNodes = useMemo(
    () => data.nodes.filter(passes),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.nodes, activeCats, minFiles]
  );
  const visibleCodes = filtersActive
    ? new Set(filteredNodes.map((n) => n.code))
    : null;

  const groups = data.rings.map((r) => ({
    category: r.category,
    label: r.label,
    color: r.color,
    nodes: filteredNodes.filter((n) => n.category === r.category),
  }));

  const selectedCode = selected?.code ?? null;

  // drop the selection if filters hide it
  useEffect(() => {
    if (selected && !passes(selected)) setSelected(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCats, minFiles]);

  function toggleCat(c: CategoryId) {
    setActiveCats((prev) => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next.size === 0 ? new Set(ALL_CATS) : next;
    });
  }

  // ---- adaptive fallback: 2D directory on mobile / weak / low-power devices ----
  if (webgl === null || !caps.ready) {
    return (
      <div className="h-[100svh]">
        <SceneLoading />
      </div>
    );
  }
  // enable3D already factors in WebGL + reduced-motion + device tier
  if (!isDesktop || !caps.enable3D) {
    return <OrbitDirectory data={data} />;
  }

  // ---- desktop hybrid ----
  return (
    <section className="relative h-[100svh] w-full overflow-hidden">
      <div className="absolute inset-0">
        <OrbitScene
          data={data}
          selectedCode={selectedCode}
          highlightCode={selectedCode}
          visibleCodes={visibleCodes}
          onSelect={setSelected}
        />
      </div>

      {/* primary search + filters (top, beside the sidebar) */}
      <div
        className="pointer-events-none absolute top-24 z-20 flex flex-col items-center transition-[left] duration-300"
        style={{ left: sidebarOpen ? "20rem" : "1.5rem", right: "1.5rem" }}
      >
        <div className="pointer-events-auto w-[min(92vw,34rem)]">
          <OrbitSearch nodes={filteredNodes} onSelect={setSelected} />
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {data.rings.map((r) => {
              const on = activeCats.has(r.category);
              return (
                <button
                  key={r.category}
                  onClick={() => toggleCat(r.category)}
                  aria-pressed={on}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition",
                    on ? "glass-strong text-fg" : "glass text-fg/40"
                  )}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: r.color, opacity: on ? 1 : 0.4 }}
                  />
                  {r.label.split(" ")[0]}
                </button>
              );
            })}
            <span className="mx-1 h-4 w-px bg-fg/10" />
            {FILE_FILTERS.map((o) => (
              <button
                key={o.v}
                onClick={() => setMinFiles(o.v)}
                aria-pressed={minFiles === o.v}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition",
                  minFiles === o.v ? "glass-strong text-fg" : "glass text-fg/40"
                )}
              >
                {o.l === "All" ? "Any size" : `${o.l} files`}
              </button>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-fg/40">
            Search, pick from the list, or explore the map · press{" "}
            <kbd className="rounded border border-fg/15 px-1">/</kbd> anywhere
          </p>
        </div>
      </div>

      {/* structured sidebar (left) */}
      <div className="absolute left-5 top-24 z-20">
        <CurriculumSidebar
          groups={groups}
          selectedCode={selectedCode}
          onSelect={setSelected}
          open={sidebarOpen}
          onToggle={() => setSidebarOpen((v) => !v)}
        />
      </div>

      {/* radar (bottom-right) */}
      <div className="absolute bottom-5 right-5 z-20 hidden md:block">
        <MiniMap
          data={data}
          selectedCode={selectedCode}
          visibleCodes={visibleCodes}
          onSelect={setSelected}
        />
      </div>

      {/* focus panel (bottom centre) */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="absolute bottom-5 left-1/2 z-30 w-[min(92vw,22rem)] -translate-x-1/2 overflow-hidden rounded-3xl glass-strong p-6 shadow-glow"
          >
            <span
              className="absolute inset-x-0 top-0 h-1"
              style={{ background: `linear-gradient(90deg, ${selected.color}, transparent)` }}
            />
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-display text-2xl font-semibold text-fg">
                  {selected.code}
                </div>
                <div className="truncate text-sm text-fg/55">{selected.title}</div>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full text-fg/45 transition-colors hover:bg-fg/5 hover:text-fg"
              >
                ✕
              </button>
            </div>

            {selected.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selected.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-fg/10 bg-fg/[0.03] px-2.5 py-1 text-[11px] text-fg/60"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-5 flex items-center justify-between">
              <span className="text-sm text-fg/50">
                <span className="font-semibold text-fg">{selected.fileCount}</span> files
              </span>
              <button
                onClick={() => router.push(courseHref(selected.code))}
                className="inline-flex items-center gap-1.5 rounded-full bg-fg px-4 py-2 text-sm font-semibold text-bg transition-transform hover:scale-[1.03]"
              >
                Open course →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
