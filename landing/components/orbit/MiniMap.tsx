"use client";

import type { OrbitData, OrbitNode } from "@/lib/orbit-layout";
import { cn } from "@/lib/cn";

/** Radar: a flat top-down map of the orbit. Shows category zones + focus,
 *  and lets you jump to any course instantly. */
export default function MiniMap({
  data,
  selectedCode,
  visibleCodes,
  onSelect,
}: {
  data: OrbitData;
  selectedCode: string | null;
  visibleCodes: Set<string> | null;
  onSelect: (n: OrbitNode) => void;
}) {
  const R = data.maxRadius;
  const toPct = (v: number) => 50 + (v / R) * 46;

  return (
    <div className="pointer-events-auto rounded-2xl glass-strong p-3 shadow-glow">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-fg/45">
        Radar
      </div>
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          {data.rings.map((r) => (
            <circle
              key={r.category}
              cx="50"
              cy="50"
              r={(r.radius / R) * 46}
              fill="none"
              stroke={r.color}
              strokeOpacity="0.25"
              strokeWidth="0.4"
            />
          ))}
          <line x1="50" y1="4" x2="50" y2="96" className="text-fg/10" stroke="currentColor" strokeWidth="0.3" />
          <line x1="4" y1="50" x2="96" y2="50" className="text-fg/10" stroke="currentColor" strokeWidth="0.3" />
          <circle cx="50" cy="50" r="2.6" fill="#C17A2B" />
        </svg>
        {data.nodes.map((n) => {
          const vis = !visibleCodes || visibleCodes.has(n.code);
          const sel = selectedCode === n.code;
          return (
            <button
              key={n.code}
              onClick={() => vis && onSelect(n)}
              aria-label={`${n.code} on radar`}
              style={{
                left: `${toPct(n.x)}%`,
                top: `${toPct(n.z)}%`,
                background: n.color,
                opacity: vis ? 1 : 0.2,
              }}
              className={cn(
                "absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform hover:scale-150",
                sel && "scale-[1.9] ring-2 ring-fg"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
