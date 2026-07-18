"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { CategoryId } from "@/lib/types";
import type { OrbitNode } from "@/lib/orbit-layout";
import { cn } from "@/lib/cn";

export interface SidebarGroup {
  category: CategoryId;
  label: string;
  color: string;
  nodes: OrbitNode[];
}

export default function CurriculumSidebar({
  groups,
  selectedCode,
  onSelect,
  open,
  onToggle,
}: {
  groups: SidebarGroup[];
  selectedCode: string | null;
  onSelect: (n: OrbitNode) => void;
  open: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState<Set<CategoryId>>(
    () => new Set(groups.map((g) => g.category))
  );

  // auto-expand the group that holds the selected course
  useEffect(() => {
    if (!selectedCode) return;
    const g = groups.find((gr) => gr.nodes.some((n) => n.code === selectedCode));
    if (g) setExpanded((prev) => new Set(prev).add(g.category));
  }, [selectedCode, groups]);

  if (!open) {
    return (
      <button
        onClick={onToggle}
        aria-label="Open curriculum panel"
        className="pointer-events-auto grid h-11 w-11 place-items-center rounded-2xl glass-strong text-fg/70 shadow-glow transition-colors hover:text-fg"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    );
  }

  return (
    <div className="pointer-events-auto flex max-h-[calc(100svh-9rem)] w-72 flex-col overflow-hidden rounded-3xl glass-strong shadow-glow">
      <div className="flex items-center justify-between border-b border-fg/10 px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-fg/55">
          Curriculum
        </span>
        <button
          onClick={onToggle}
          aria-label="Collapse curriculum panel"
          className="grid h-7 w-7 place-items-center rounded-lg text-fg/45 transition-colors hover:bg-fg/5 hover:text-fg"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {groups.map((g) => {
          const isOpen = expanded.has(g.category);
          return (
            <div key={g.category} className="mb-1">
              <button
                onClick={() =>
                  setExpanded((prev) => {
                    const next = new Set(prev);
                    next.has(g.category) ? next.delete(g.category) : next.add(g.category);
                    return next;
                  })
                }
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-fg/[0.04]"
              >
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ background: g.color, boxShadow: `0 0 8px ${g.color}` }}
                />
                <span className="flex-1 text-sm font-semibold text-fg">{g.label}</span>
                <span className="text-xs text-fg/40">{g.nodes.length}</span>
                <svg
                  viewBox="0 0 24 24"
                  className={cn("h-3.5 w-3.5 text-fg/40 transition-transform", isOpen && "rotate-90")}
                  fill="none"
                >
                  <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.21, 0.47, 0.32, 0.98] }}
                    className="overflow-hidden pl-3"
                  >
                    {g.nodes.map((n) => {
                      const active = selectedCode === n.code;
                      return (
                        <li key={n.code}>
                          <button
                            onClick={() => onSelect(n)}
                            aria-current={active}
                            className={cn(
                              "group flex w-full items-center gap-2 rounded-lg py-1.5 pl-3 pr-2 text-left text-sm transition-colors",
                              active ? "bg-fg/[0.08] text-fg" : "text-fg/55 hover:bg-fg/[0.04] hover:text-fg"
                            )}
                          >
                            <span
                              className={cn(
                                "h-3 w-0.5 flex-shrink-0 rounded-full transition-opacity",
                                active ? "opacity-100" : "opacity-0"
                              )}
                              style={{ background: g.color }}
                            />
                            <span className="font-medium">{n.code}</span>
                            <span className="truncate text-xs text-fg/40">{n.title}</span>
                          </button>
                        </li>
                      );
                    })}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
