"use client";

import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { VaultFile } from "@/lib/types";
import { courseHref } from "@/lib/vault-data";
import { TYPE_TOKEN } from "@/lib/ui-meta";
import { cn } from "@/lib/cn";
import BookmarkButton from "../BookmarkButton";

function SmartCard({
  file,
  index,
  onPeek,
}: {
  file: VaultFile;
  index: number;
  onPeek: (f: VaultFile) => void;
}) {
  const token = TYPE_TOKEN[file.type];
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 220, damping: 18 });
  const rotateY = useSpring(ry, { stiffness: 220, damping: 18 });

  function onMove(e: React.MouseEvent) {
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 12);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 10);
  }
  function reset() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.4), ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 800 }}
    >
      <motion.div
        role="button"
        tabIndex={0}
        onClick={() => onPeek(file)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPeek(file);
          }
        }}
        onMouseMove={onMove}
        onMouseLeave={reset}
        style={{ rotateX, rotateY, transformPerspective: 800 }}
        whileHover={{ scale: 1.025 }}
        className="group relative flex w-full cursor-pointer items-start gap-3.5 overflow-hidden rounded-2xl glass p-4 text-left shadow-soft outline-none transition-shadow hover:shadow-glow focus-visible:ring-1 focus-visible:ring-accent/50"
      >
        <span
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ boxShadow: `inset 0 0 0 1px rgb(var(${token}) / 0.5)` }}
        />
        <span
          className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl text-[10px] font-bold uppercase tracking-wide"
          style={{ background: `rgb(var(${token}) / 0.16)`, color: `rgb(var(${token}))` }}
        >
          {file.format}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-fg">{file.title}</p>
          <div className="mt-0.5 flex items-center gap-2 truncate text-xs text-fg/45">
            <span className="font-medium text-fg/70">{file.course}</span>
            <span className="h-1 w-1 rounded-full bg-fg/20" />
            <span>{file.type}</span>
          </div>
          {/* reveal on hover */}
          <div className="mt-2 flex max-h-0 flex-wrap gap-1.5 overflow-hidden opacity-0 transition-all duration-300 group-hover:max-h-16 group-hover:opacity-100">
            {file.tags.slice(0, 3).map((t) => (
              <span key={t} className="rounded-full bg-fg/[0.05] px-2 py-0.5 text-[10px] text-fg/55">
                #{t}
              </span>
            ))}
          </div>
        </div>

        <span onClick={(e) => e.stopPropagation()} className="relative z-10">
          <BookmarkButton id={file.id} />
        </span>
      </motion.div>
    </motion.div>
  );
}

function PeekModal({ file, onClose }: { file: VaultFile | null; onClose: () => void }) {
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {file && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-5 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-[min(92vw,30rem)] overflow-hidden rounded-3xl glass-strong p-7 shadow-glow"
          >
            <span
              className="absolute inset-x-0 top-0 h-1"
              style={{ background: `linear-gradient(90deg, rgb(var(${TYPE_TOKEN[file.type]})), transparent)` }}
            />
            <div className="flex items-start justify-between gap-4">
              <span
                className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl text-[11px] font-bold uppercase"
                style={{
                  background: `rgb(var(${TYPE_TOKEN[file.type]}) / 0.16)`,
                  color: `rgb(var(${TYPE_TOKEN[file.type]}))`,
                }}
              >
                {file.format}
              </span>
              <BookmarkButton id={file.id} />
            </div>

            <h3 className="mt-4 font-display text-xl font-semibold text-fg">{file.title}</h3>
            <p className="mt-1 text-sm text-fg/55">
              {file.course} · {file.courseTitle}
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              {[
                ["Type", file.type],
                ["Term", `${file.semester} ${file.year}`],
                ["Size", file.size],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-fg/10 bg-fg/[0.03] px-2 py-2.5">
                  <div className="text-fg/40">{k}</div>
                  <div className="mt-0.5 font-medium text-fg/80">{v}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {file.tags.map((t) => (
                <span key={t} className="rounded-full bg-fg/[0.05] px-2.5 py-1 text-[11px] text-fg/55">
                  #{t}
                </span>
              ))}
            </div>

            <button
              onClick={() => router.push(courseHref(file.course))}
              className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-fg px-4 py-2.5 text-sm font-semibold text-bg transition-transform hover:scale-[1.02]"
            >
              Open {file.course} →
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function SmartGrid({
  files,
  cols = 2,
}: {
  files: VaultFile[];
  cols?: 1 | 2;
}) {
  const [peek, setPeek] = useState<VaultFile | null>(null);
  return (
    <>
      <div className={cn("grid grid-cols-1 gap-3", cols === 2 && "sm:grid-cols-2")}>
        {files.map((f, i) => (
          <SmartCard key={f.id} file={f} index={i} onPeek={setPeek} />
        ))}
      </div>
      <PeekModal file={peek} onClose={() => setPeek(null)} />
    </>
  );
}
