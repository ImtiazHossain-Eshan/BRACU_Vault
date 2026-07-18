"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { Slice } from "@/lib/filters";
import { TYPE_TOKEN } from "@/lib/ui-meta";
import { cn } from "@/lib/cn";
import CountUp from "./CountUp";

const SIZE = 184;
const SW = 18;
const R = SIZE / 2 - SW / 2 - 2;
const CX = SIZE / 2;

const tokenOf = (key: string) =>
  TYPE_TOKEN[key as keyof typeof TYPE_TOKEN] ?? "--accent";

/**
 * "Vault pulse" — a segmented donut that draws in on load, with a count-up core
 * and hover-to-highlight legend. Replaces the flat progress bars.
 */
export default function VaultPulse({
  data,
  title = "Vault at a glance",
}: {
  data: Slice[];
  title?: string;
}) {
  const total = Math.max(1, data.reduce((s, d) => s + d.count, 0));
  const [active, setActive] = useState<string | null>(null);

  // cumulative fractions for segment start positions
  let acc = 0;
  const segs = data.map((d) => {
    const frac = d.count / total;
    const startDeg = acc * 360 - 90;
    acc += frac;
    return { ...d, frac, startDeg, pct: Math.round(frac * 100) };
  });

  const activeSlice = segs.find((s) => s.key === active) ?? null;

  return (
    <div className="rounded-3xl glass-strong p-6 shadow-soft">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-fg/45">{title}</p>

      <div className="relative mx-auto mt-5 grid place-items-center" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="block">
          {/* track */}
          <circle cx={CX} cy={CX} r={R} fill="none" stroke="rgb(var(--fg) / 0.07)" strokeWidth={SW} />
          {segs.map((s, i) => {
            const token = tokenOf(s.key);
            const dim = active && active !== s.key;
            return (
              <motion.circle
                key={s.key}
                cx={CX}
                cy={CX}
                r={R}
                fill="none"
                stroke={`rgb(var(${token}))`}
                strokeWidth={SW}
                strokeLinecap="butt"
                transform={`rotate(${s.startDeg} ${CX} ${CX})`}
                style={{ cursor: "pointer" }}
                initial={{ pathLength: 0, opacity: 1 }}
                animate={{
                  pathLength: s.frac,
                  opacity: dim ? 0.22 : 1,
                  strokeWidth: active === s.key ? SW + 5 : SW,
                }}
                transition={{
                  pathLength: { duration: 1.1, delay: 0.15 + i * 0.08, ease: [0.16, 1, 0.3, 1] },
                  default: { duration: 0.25 },
                }}
                onMouseEnter={() => setActive(s.key)}
                onMouseLeave={() => setActive(null)}
              />
            );
          })}
        </svg>

        {/* center read-out */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <AnimatePresence mode="wait">
            {activeSlice ? (
              <motion.div
                key={activeSlice.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.18 }}
              >
                <div
                  className="font-display text-3xl font-semibold"
                  style={{ color: `rgb(var(${tokenOf(activeSlice.key)}))` }}
                >
                  {activeSlice.count}
                </div>
                <div className="text-xs text-fg/55">
                  {activeSlice.key} · {activeSlice.pct}%
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="total"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.18 }}
              >
                <CountUp value={total} className="font-display text-3xl font-semibold text-fg" />
                <div className="text-xs text-fg/45">files</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* legend */}
      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5">
        {segs.map((s) => {
          const token = tokenOf(s.key);
          return (
            <button
              key={s.key}
              onMouseEnter={() => setActive(s.key)}
              onMouseLeave={() => setActive(null)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-1.5 py-1 text-left transition-colors",
                active === s.key ? "bg-fg/[0.06]" : "hover:bg-fg/[0.03]"
              )}
            >
              <span
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full transition-transform"
                style={{
                  background: `rgb(var(${token}))`,
                  transform: active === s.key ? "scale(1.3)" : "scale(1)",
                }}
              />
              <span className="flex-1 truncate text-xs text-fg/60">{s.key}</span>
              <span className="text-xs font-semibold tabular-nums text-fg/80">{s.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
