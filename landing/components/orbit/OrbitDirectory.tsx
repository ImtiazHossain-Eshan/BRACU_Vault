"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { CategoryId } from "@/lib/types";
import type { OrbitData } from "@/lib/orbit-layout";
import { courseHref } from "@/lib/vault-data";
import { fuzzyScore } from "@/lib/search";
import { cn } from "@/lib/cn";
import Highlight from "../platform/Highlight";

/** Structure-first directory used on mobile and as the no-WebGL / reduced-motion
 *  fallback - search + category tabs + a fast, flat course list. */
export default function OrbitDirectory({ data }: { data: OrbitData }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"all" | CategoryId>("all");

  const tabs = [
    { id: "all" as const, label: "All", color: "#C17A2B" },
    ...data.rings.map((r) => ({
      id: r.category,
      label: r.label.split(" ")[0],
      color: r.color,
    })),
  ];

  const list = useMemo(() => {
    const ql = q.trim();
    let res = data.nodes.filter((n) => cat === "all" || n.category === cat);
    if (ql) {
      res = res
        .map((n) => ({
          n,
          s: Math.max(fuzzyScore(ql, n.code) + 2, fuzzyScore(ql, n.title)),
        }))
        .filter((x) => x.s >= 0)
        .sort((a, b) => b.s - a.s)
        .map((x) => x.n);
    } else {
      res = [...res].sort((a, b) => a.ringIndex - b.ringIndex);
    }
    return res;
  }, [q, cat, data.nodes]);

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-24 pt-28 sm:px-8">
      <span className="text-xs font-medium uppercase tracking-[0.22em] text-accent">
        Knowledge System
      </span>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-fg">
        Find a course
      </h1>

      <div className="relative mt-6">
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-fg/40" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search courses"
          placeholder="CSE 221, Algorithms, Core…"
          className="w-full rounded-2xl glass py-3.5 pl-12 pr-4 text-sm text-fg placeholder:text-fg/35 outline-none focus:ring-1 focus:ring-accent/50"
        />
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const on = cat === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setCat(t.id)}
              className={cn(
                "flex flex-shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                on ? "bg-fg text-bg" : "glass text-fg/60 hover:text-fg"
              )}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
              {t.label}
            </button>
          );
        })}
      </div>

      <ul className="mt-5 flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {list.map((n, i) => (
            <motion.li
              key={n.code}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, delay: Math.min(i * 0.015, 0.2) }}
            >
              <Link
                href={courseHref(n.code)}
                className="flex items-center gap-3 rounded-2xl glass px-4 py-3 transition-shadow hover:shadow-glow"
              >
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ background: n.color, boxShadow: `0 0 8px ${n.color}` }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-fg">
                    <Highlight text={n.code} query={q} /> ·{" "}
                    <span className="font-normal text-fg/55">
                      <Highlight text={n.title} query={q} />
                    </span>
                  </span>
                </span>
                <span className="flex-shrink-0 text-xs text-fg/40">{n.fileCount}</span>
              </Link>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {list.length === 0 && (
        <p className="mt-10 text-center text-sm text-fg/45">No course matches “{q}”.</p>
      )}
    </div>
  );
}
