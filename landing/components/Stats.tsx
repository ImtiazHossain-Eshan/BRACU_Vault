"use client";

import { motion } from "framer-motion";
import { stats, resourceTypes } from "@/lib/data";
import Counter from "./ui/Counter";

export default function Stats() {
  return (
    <section className="relative scroll-mt-24 py-24 sm:py-28">
      <div className="mx-auto max-w-content px-5 sm:px-8">
        {/* flowing stat row — no boxes, just numbers separated by glowing hairlines */}
        <div className="grid grid-cols-2 gap-y-12 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="relative flex flex-col items-center px-4 text-center"
            >
              {/* divider between items (not before the first in each row) */}
              {i % 4 !== 0 && (
                <span className="absolute left-0 top-1/2 hidden h-16 w-px -translate-y-1/2 hairline lg:block" />
              )}
              <span className="font-display text-5xl font-semibold tracking-tightest text-fg sm:text-6xl">
                <Counter to={s.value} suffix={s.suffix} />
              </span>
              <span className="mt-3 text-sm font-medium uppercase tracking-[0.18em] text-fg/70">
                {s.label}
              </span>
              <span className="mt-1 text-xs text-fg/40">{s.hint}</span>
            </motion.div>
          ))}
        </div>

        {/* resource-type marquee — communicates breadth without a single box */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative mt-20 overflow-hidden mask-fade-x"
        >
          <div className="flex w-max animate-marquee gap-4 will-change-transform">
            {[...resourceTypes, ...resourceTypes].map((type, i) => (
              <span
                key={i}
                className="flex items-center gap-2.5 whitespace-nowrap rounded-full border border-fg/10 bg-fg/[0.02] px-5 py-2.5 text-sm text-fg/65"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-highlight to-accent-2" />
                {type}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
