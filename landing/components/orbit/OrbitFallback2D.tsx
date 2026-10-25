"use client";

import { motion } from "framer-motion";
import type { OrbitData, OrbitNode } from "@/lib/orbit-layout";

/** Flat version of the orbit - same layout algorithm, no WebGL. */
export default function OrbitFallback2D({
  data,
  selectedCode,
  onSelect,
}: {
  data: OrbitData;
  selectedCode: string | null;
  onSelect: (n: OrbitNode | null) => void;
}) {
  const R = data.maxRadius;
  const toPct = (v: number) => 50 + (v / R) * 44; // [-R,R] → [6%,94%]

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[36rem]">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="coreG">
            <stop offset="0%" stopColor="#E8E1D9" />
            <stop offset="55%" stopColor="#C17A2B" />
            <stop offset="100%" stopColor="#A0633D" />
          </radialGradient>
        </defs>
        {data.rings.map((r) => (
          <circle
            key={r.category}
            cx="50"
            cy="50"
            r={(r.radius / R) * 44}
            fill="none"
            stroke={r.color}
            strokeOpacity="0.3"
            strokeWidth="0.3"
          />
        ))}
        <circle cx="50" cy="50" r="6" fill="url(#coreG)" />
      </svg>

      {data.nodes.map((n, i) => {
        const dimmed = !!selectedCode && selectedCode !== n.code;
        return (
          <motion.button
            key={n.code}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: dimmed ? 0.25 : 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.02, type: "spring", stiffness: 260, damping: 20 }}
            onClick={() => onSelect(n)}
            style={{ left: `${toPct(n.x)}%`, top: `${toPct(n.z)}%`, color: n.color }}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            aria-label={`${n.code} ${n.title}`}
          >
            <span
              className="block h-3 w-3 rounded-full ring-2 ring-bg transition-transform group-hover:scale-150"
              style={{ background: "currentColor", boxShadow: `0 0 10px ${n.color}` }}
            />
            <span className="pointer-events-none absolute left-1/2 top-4 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg glass-strong px-2 py-1 text-[10px] font-medium text-fg shadow-glow group-hover:block">
              {n.code} · {n.fileCount}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
