"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import { useMemo } from "react";

/** Deterministic small floats so SSR and client agree (no hydration drift). */
function seeded(n: number) {
  let a = n + 0x6d2b79f5;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Dashboard-local ambient layer: a few drifting blurred orbs, a slow light
 * sweep and faint floating particles. Sits above the global Atmosphere, below
 * content. Parallax via px/py; all motion is gated by `animate`.
 */
export default function AmbientField({
  px,
  py,
  animate,
}: {
  px: MotionValue<number>;
  py: MotionValue<number>;
  animate: boolean;
}) {
  // orb parallax (different depths move by different amounts)
  const o1x = useTransform(px, (v) => v * -28);
  const o1y = useTransform(py, (v) => v * -22);
  const o2x = useTransform(px, (v) => v * 36);
  const o2y = useTransform(py, (v) => v * 26);
  const o3x = useTransform(px, (v) => v * -18);
  const o3y = useTransform(py, (v) => v * 30);

  const particles = useMemo(() => {
    const rnd = seeded(98765);
    return Array.from({ length: 16 }, () => ({
      left: rnd() * 100,
      top: rnd() * 100,
      size: 2 + rnd() * 3,
      dur: 7 + rnd() * 8,
      delay: rnd() * 6,
      drift: 10 + rnd() * 22,
    }));
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* drifting orbs */}
      <motion.div
        style={{ x: o1x, y: o1y }}
        className="absolute -left-24 top-10 h-[26rem] w-[26rem] rounded-full opacity-[0.5] blur-[90px]"
      >
        <motion.div
          className="h-full w-full rounded-full"
          style={{ background: "radial-gradient(circle, rgb(var(--accent) / 0.5), transparent 65%)" }}
          animate={animate ? { scale: [1, 1.12, 1], x: [0, 18, 0], y: [0, -14, 0] } : undefined}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      <motion.div
        style={{ x: o2x, y: o2y }}
        className="absolute right-[-6rem] top-1/3 h-[30rem] w-[30rem] rounded-full opacity-[0.4] blur-[100px]"
      >
        <motion.div
          className="h-full w-full rounded-full"
          style={{ background: "radial-gradient(circle, rgb(var(--highlight) / 0.45), transparent 65%)" }}
          animate={animate ? { scale: [1, 1.15, 1], x: [0, -22, 0], y: [0, 18, 0] } : undefined}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      <motion.div
        style={{ x: o3x, y: o3y }}
        className="absolute bottom-[-4rem] left-1/3 h-[24rem] w-[24rem] rounded-full opacity-[0.35] blur-[90px]"
      >
        <motion.div
          className="h-full w-full rounded-full"
          style={{ background: "radial-gradient(circle, rgb(var(--accent-3) / 0.5), transparent 65%)" }}
          animate={animate ? { scale: [1, 1.1, 1], x: [0, 16, 0], y: [0, 12, 0] } : undefined}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* slow light sweep */}
      {animate && (
        <motion.div
          className="absolute inset-y-0 w-1/3 skew-x-12"
          style={{ background: "linear-gradient(90deg, transparent, rgb(var(--fg) / 0.045), transparent)" }}
          initial={{ x: "-50%" }}
          animate={{ x: ["-50%", "320%"] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", repeatDelay: 4 }}
        />
      )}

      {/* faint particles */}
      {animate &&
        particles.map((p, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              background: "rgb(var(--accent) / 0.5)",
            }}
            animate={{ y: [0, -p.drift, 0], opacity: [0, 0.7, 0] }}
            transition={{ duration: p.dur, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
          />
        ))}
    </div>
  );
}
