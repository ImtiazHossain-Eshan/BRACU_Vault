"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import type { MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface MagneticButtonProps {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "ghost";
  className?: string;
}

/** Button that subtly leans toward the cursor — premium microinteraction. */
export default function MagneticButton({
  children,
  href = "#",
  variant = "primary",
  className,
}: MagneticButtonProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 16, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 16, mass: 0.4 });

  function handleMove(e: MouseEvent<HTMLAnchorElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.35);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.35);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  const base =
    "group relative inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold tracking-wide transition-colors duration-300 will-change-transform";

  const styles =
    variant === "primary"
      ? "text-bg"
      : "text-fg/85 glass hover:text-fg";

  return (
    <motion.a
      href={href}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.96 }}
      className={cn(base, styles, className)}
    >
      {variant === "primary" && (
        <>
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-highlight via-accent to-accent-2" />
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-highlight via-accent to-accent-2 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-70" />
          {/* sheen */}
          <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
            <span className="absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-white/30 blur-md animate-shimmer" />
          </span>
        </>
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.a>
  );
}
