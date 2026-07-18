"use client";

import { motion } from "framer-motion";
import type { Slice } from "@/lib/filters";
import { TYPE_TOKEN } from "@/lib/ui-meta";

/** Animated horizontal bars — grow on mount and re-flow when data changes. */
export default function DataViz({
  data,
  title = "Distribution by type",
}: {
  data: Slice[];
  title?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="rounded-2xl glass p-5">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-fg/45">
        {title}
      </p>
      <div className="mt-4 flex flex-col gap-3">
        {data.map((d, i) => {
          const token =
            TYPE_TOKEN[d.key as keyof typeof TYPE_TOKEN] ?? "--accent";
          return (
            <div key={d.key} className="flex items-center gap-3">
              <span className="w-24 flex-shrink-0 text-xs text-fg/60">
                {d.key}
              </span>
              <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-fg/[0.06]">
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: `${(d.count / max) * 100}%` }}
                  transition={{
                    duration: 0.8,
                    delay: i * 0.06,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, rgb(var(${token}) / 0.45), rgb(var(${token})))`,
                  }}
                />
              </div>
              <span className="w-8 flex-shrink-0 text-right text-xs tabular-nums text-fg/70">
                {d.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
