"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { categories } from "@/lib/data";
import { fuzzyScore } from "@/lib/search";
import type { OrbitNode } from "@/lib/orbit-layout";
import { cn } from "@/lib/cn";
import Highlight from "../platform/Highlight";

const labelFor = (id: string) =>
  categories.find((c) => c.id === id)?.label ?? id;

export default function OrbitSearch({
  nodes,
  onSelect,
}: {
  nodes: OrbitNode[];
  onSelect: (n: OrbitNode) => void;
}) {
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const ql = q.trim();
    if (!ql) return [];
    return nodes
      .map((n) => ({
        n,
        s: Math.max(
          fuzzyScore(ql, n.code) + 2,
          fuzzyScore(ql, n.title),
          fuzzyScore(ql, labelFor(n.category))
        ),
      }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map((x) => x.n);
  }, [q, nodes]);

  const open = focused && q.trim().length > 0;

  function choose(n: OrbitNode) {
    onSelect(n);
    setQ("");
    setFocused(false);
    inputRef.current?.blur();
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === "Escape") {
      setFocused(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-fg/40" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          onKeyDown={onKey}
          role="combobox"
          aria-expanded={open}
          aria-controls="orbit-search-list"
          aria-label="Search courses by code, name or category"
          placeholder="Find a course: CSE 221, Algorithms, Core…"
          className="w-full rounded-2xl glass-strong py-3.5 pl-12 pr-16 text-sm text-fg placeholder:text-fg/35 shadow-glow outline-none transition focus:ring-1 focus:ring-accent/50"
        />
        <kbd className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md border border-fg/15 px-1.5 py-0.5 text-[10px] text-fg/40">
          /
        </kbd>
      </div>

      <AnimatePresence>
        {open && (
          <motion.ul
            id="orbit-search-list"
            role="listbox"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute z-30 mt-2 max-h-[50vh] w-full overflow-auto rounded-2xl glass-strong p-2 shadow-glow"
          >
            {results.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-fg/40">
                No course matches “{q}”.
              </li>
            ) : (
              results.map((n, i) => (
                <li key={n.code} role="option" aria-selected={i === active}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(n)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      i === active ? "bg-fg/[0.07]" : "hover:bg-fg/[0.04]"
                    )}
                  >
                    <span
                      className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                      style={{ background: n.color, boxShadow: `0 0 8px ${n.color}` }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-fg">
                        <Highlight text={`${n.code} · ${n.title}`} query={q} />
                      </span>
                      <span className="block text-xs text-fg/45">
                        {labelFor(n.category)} · {n.fileCount} files
                      </span>
                    </span>
                    {i === active && <span className="text-[10px] text-fg/40">↵</span>}
                  </button>
                </li>
              ))
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
