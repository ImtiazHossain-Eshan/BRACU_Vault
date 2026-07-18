"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import type { MouseEvent } from "react";

/** Course-code shards that float around the core with parallax depth. */
const shards = [
  { label: "CSE221", top: "6%", left: "8%", depth: 46, delay: 0 },
  { label: "MAT110", top: "16%", left: "78%", depth: 64, delay: 0.6 },
  { label: "CSE423", top: "70%", left: "4%", depth: 58, delay: 1.1 },
  { label: "CSE470", top: "82%", left: "70%", depth: 40, delay: 0.3 },
  { label: "STA201", top: "44%", left: "90%", depth: 72, delay: 0.9 },
];

function Shard({
  label,
  top,
  left,
  depth,
  delay,
  px,
  py,
}: {
  label: string;
  top: string;
  left: string;
  depth: number;
  delay: number;
  px: MotionValue<number>;
  py: MotionValue<number>;
}) {
  const x = useTransform(px, (v) => v * depth);
  const y = useTransform(py, (v) => v * depth);

  return (
    <motion.div
      style={{ top, left, x, y }}
      className="absolute -translate-x-1/2 -translate-y-1/2"
    >
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{
          duration: 5 + delay,
          repeat: Infinity,
          ease: "easeInOut",
          delay,
        }}
        className="glass-strong rounded-2xl px-3.5 py-2 text-xs font-medium tracking-wide text-fg/85 shadow-glow"
      >
        <span className="bg-gradient-to-r from-highlight to-accent-2 bg-clip-text text-transparent">
          {label}
        </span>
      </motion.div>
    </motion.div>
  );
}

export default function VaultCore() {
  // normalized pointer position in [-0.5, 0.5]
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spx = useSpring(px, { stiffness: 120, damping: 18, mass: 0.6 });
  const spy = useSpring(py, { stiffness: 120, damping: 18, mass: 0.6 });

  const rotateY = useTransform(spx, [-0.5, 0.5], [18, -18]);
  const rotateX = useTransform(spy, [-0.5, 0.5], [-18, 18]);

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function reset() {
    px.set(0);
    py.set(0);
  }

  return (
    <div
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className="perspective relative mx-auto aspect-square w-full max-w-[34rem]"
    >
      <motion.div
        style={{ rotateX, rotateY }}
        className="preserve-3d relative h-full w-full"
      >
        {/* orbital ring system, tilted into a 3D plane */}
        <div
          className="preserve-3d absolute inset-0 grid place-items-center"
          style={{ transform: "rotateX(62deg)" }}
        >
          {[
            { size: "98%", dur: "26s", reverse: false, color: "var(--ring-1)" },
            { size: "74%", dur: "19s", reverse: true, color: "var(--ring-2)" },
            { size: "52%", dur: "13s", reverse: false, color: "var(--ring-3)" },
          ].map((ring, i) => (
            <div
              key={i}
              className="absolute rounded-full border"
              style={{
                width: ring.size,
                height: ring.size,
                borderColor: ring.color,
                boxShadow: `0 0 40px -8px ${ring.color}`,
                animation: `spinSlow ${ring.dur} linear infinite`,
                animationDirection: ring.reverse ? "reverse" : "normal",
              }}
            >
              {/* a bright traveler that orbits along the ring */}
              <span
                className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  background: "rgb(var(--fg))",
                  boxShadow: "var(--traveler-glow)",
                }}
              />
            </div>
          ))}
        </div>

        {/* glowing core orb */}
        <div className="absolute inset-0 grid place-items-center">
          <div className="relative grid place-items-center">
            <div
              className="absolute h-56 w-56 rounded-full blur-2xl animate-pulse-glow"
              style={{ backgroundImage: "var(--core-aura)" }}
            />
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative h-36 w-36 rounded-full"
              style={{
                backgroundImage: "var(--core-grad)",
                boxShadow: "var(--core-shadow)",
              }}
            >
              {/* specular highlight */}
              <span className="absolute left-6 top-5 h-7 w-10 rounded-full bg-white/70 blur-md" />
              {/* faceted vault seams */}
              <span className="absolute inset-0 rounded-full border border-white/20" />
              <span className="absolute inset-4 rounded-full border border-white/10" />
            </motion.div>
          </div>
        </div>

        {/* floating course-code shards */}
        {shards.map((s) => (
          <Shard key={s.label} {...s} px={spx} py={spy} />
        ))}
      </motion.div>
    </div>
  );
}
