"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { categories, courses, type CategoryId } from "@/lib/data";
import SectionHeading from "./ui/SectionHeading";
import { cn } from "@/lib/cn";

type Filter = "all" | CategoryId;

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "core", label: "Core CS" },
  { id: "electives", label: "Electives" },
  { id: "math", label: "Math & Science" },
  { id: "gened", label: "GenEd" },
];

const accentFor = (id: CategoryId) => {
  const c = categories.find((x) => x.id === id)!;
  return { from: c.from, to: c.to };
};

export default function CourseExplorer() {
  const [active, setActive] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((c) => {
      const matchesFilter = active === "all" || c.category === active;
      const matchesQuery =
        !q ||
        c.code.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [active, query]);

  return (
    <section id="courses" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <SectionHeading
          eyebrow="Course Explorer"
          title={
            <>
              Find any course in{" "}
              <span className="text-gradient">a heartbeat</span>
            </>
          }
          subtitle="Filter by pillar or search by code and title. Every result fans into place with a single, fluid motion."
        />

        {/* controls */}
        <div className="mt-12 flex flex-col items-center gap-5">
          {/* search */}
          <div className="relative w-full max-w-md">
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-fg/40"
              fill="none"
            >
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path
                d="m20 20-3-3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search e.g. CSE 221, Algorithms, Calculus…"
              className="w-full rounded-full glass py-3.5 pl-12 pr-5 text-sm text-fg placeholder:text-fg/35 outline-none transition-shadow focus:shadow-glow focus:ring-1 focus:ring-accent/50"
            />
          </div>

          {/* filter pills with shared layout indicator */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setActive(f.id)}
                className={cn(
                  "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active === f.id ? "text-bg" : "text-fg/60 hover:text-fg"
                )}
              >
                {active === f.id && (
                  <motion.span
                    layoutId="filter-pill"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-highlight via-accent to-accent-2"
                  />
                )}
                <span className="relative z-10">{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* results — organic flowing wrap, animated in/out */}
        <motion.div layout className="mt-12 flex flex-wrap justify-center gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((c) => {
              const accent = accentFor(c.category);
              return (
                <motion.a
                  key={c.code}
                  href="#"
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.28, ease: [0.21, 0.47, 0.32, 0.98] }}
                  whileHover={{ y: -4 }}
                  className="group relative flex items-center gap-3 overflow-hidden rounded-2xl glass px-4 py-3 transition-shadow hover:shadow-glow"
                >
                  <span
                    className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl text-[11px] font-bold text-bg"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                    }}
                  >
                    {c.code.replace(/\D/g, "")}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold text-fg">
                      {c.code}
                    </span>
                    <span className="text-xs text-fg/50">{c.title}</span>
                  </span>
                </motion.a>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* empty state */}
        {filtered.length === 0 && (
          <p className="mt-10 text-center text-sm text-fg/45">
            No courses match “{query}”. Try another code or title.
          </p>
        )}
      </div>
    </section>
  );
}
