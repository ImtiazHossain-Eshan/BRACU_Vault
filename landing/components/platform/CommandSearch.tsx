"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePreview } from "@/components/preview/PreviewProvider";
import type { VaultResource } from "@/lib/preview-utils";
import { cn } from "@/lib/cn";
import Highlight from "./Highlight";

/** Global ⌘K / Ctrl+K / "/" search over every real file in the vault.
 *  Selecting a result opens the file preview inline - the single
 *  "find anything, fast" surface across all courses. */
export default function CommandSearch() {
  const { open: openPreview } = usePreview();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<VaultResource[]>([]);
  const [total, setTotal] = useState(0);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const isTyping = () => {
      const el = document.activeElement as HTMLElement | null;
      return (
        !!el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      );
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "/" && !isTyping()) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("bracu:search-open", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("bracu:search-open", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setActive(0);
    const t = setTimeout(() => inputRef.current?.focus(), 40);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const h = setTimeout(async () => {
      setLoading(true);
      try {
        // Client-side search over the bundled index (lazy-loaded on first use),
        // with admin overrides applied so hidden/edited files match the catalog.
        const [{ filterResources }, { fetchOverrides, applyOverrides }] = await Promise.all([
          import("@/lib/resources"),
          import("@/lib/overrides"),
        ]);
        const overrides = await fetchOverrides();
        const all = applyOverrides(filterResources({ q }), overrides);
        if (!cancelled) {
          setResults(all.slice(0, 8));
          setTotal(all.length);
          setActive(0);
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) setLoading(false);
    }, 140);
    return () => {
      cancelled = true;
      clearTimeout(h);
    };
  }, [q, open]);

  const choose = useCallback(
    (f: VaultResource) => {
      setOpen(false);
      openPreview(f);
    },
    [openPreview]
  );

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      choose(results[active]);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-bg/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="relative w-full max-w-xl overflow-hidden rounded-3xl glass-strong shadow-glow"
          >
            <div className="flex items-center gap-3 border-b border-fg/10 px-5 py-4">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-fg/40" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Search every file: notes, slides, past exams, code…"
                className="w-full bg-transparent text-sm text-fg placeholder:text-fg/35 outline-none"
              />
              <kbd className="hidden rounded-md border border-fg/15 px-1.5 py-0.5 text-[10px] text-fg/40 sm:block">
                ESC
              </kbd>
            </div>

            <div className="max-h-[52vh] overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-fg/40">
                  {loading ? "Searching…" : q ? "No matches found." : "Type to search the vault."}
                </p>
              ) : (
                <ul>
                  {results.map((f, i) => (
                    <motion.li
                      key={f.p}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: i * 0.03 }}
                    >
                      <button
                        onMouseEnter={() => setActive(i)}
                        onClick={() => choose(f)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                          i === active ? "bg-fg/[0.07]" : "hover:bg-fg/[0.04]"
                        )}
                      >
                        <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-accent/[0.16] text-[9px] font-bold uppercase text-accent">
                          {f.ext}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-fg">
                            <Highlight text={f.name} query={q} />
                          </span>
                          <span className="flex items-center gap-1.5 truncate text-xs text-fg/45">
                            <span>{f.course}</span>
                            {f.section?.startsWith("Python") ? (
                              <>
                                <span className="inline-flex items-center gap-1 rounded-md border border-fg/10 bg-fg/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-fg/75">
                                  <img src="/icons/python.png" alt="" className="h-3 w-3 object-contain" />
                                  Python
                                </span>
                                <span>· {f.section.replace(/^Python\s*\/\s*/i, "")}</span>
                              </>
                            ) : f.section?.startsWith("Java") ? (
                              <>
                                <span className="inline-flex items-center gap-1 rounded-md border border-fg/10 bg-fg/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-fg/75">
                                  <img src="/icons/java.png" alt="" className="h-3 w-3 object-contain" />
                                  Java
                                </span>
                                <span>· {f.section.replace(/^Java\s*\/\s*/i, "")}</span>
                              </>
                            ) : (
                              <span>{f.section ? ` · ${f.section}` : ""}</span>
                            )}
                          </span>
                        </span>
                        {i === active && (
                          <span className="hidden text-[10px] text-fg/40 sm:block">↵ preview</span>
                        )}
                      </button>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-fg/10 px-5 py-3 text-[11px] text-fg/40">
              <span>{total > 0 ? `${total} match${total === 1 ? "" : "es"}` : "Search across every course"}</span>
              <span className="hidden items-center gap-1.5 sm:flex">
                <kbd className="rounded border border-fg/15 px-1">↑↓</kbd> navigate
                <kbd className="rounded border border-fg/15 px-1">↵</kbd> preview
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
