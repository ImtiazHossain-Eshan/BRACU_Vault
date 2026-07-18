"use client";

import { useMotionValue, useSpring } from "framer-motion";

/**
 * Pointer-driven parallax. Returns springy normalized motion values in [-1, 1]
 * plus handlers to bind to a container. Decorative layers read `px`/`py` via
 * `useTransform` so depth shifts happen on the compositor — no React re-renders.
 */
export function usePointerParallax(enabled = true) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const px = useSpring(rx, { stiffness: 45, damping: 16, mass: 0.6 });
  const py = useSpring(ry, { stiffness: 45, damping: 16, mass: 0.6 });

  function onMouseMove(e: React.MouseEvent) {
    if (!enabled) return;
    const r = e.currentTarget.getBoundingClientRect();
    rx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    ry.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  }
  function onMouseLeave() {
    rx.set(0);
    ry.set(0);
  }

  return { px, py, onMouseMove, onMouseLeave };
}
