"use client";

import { animate, useInView } from "framer-motion";
import { useEffect, useRef } from "react";

interface CounterProps {
  to: number;
  suffix?: string;
  duration?: number;
  className?: string;
}

/** Counts up from 0 → `to` the first time it scrolls into view. */
export default function Counter({
  to,
  suffix = "",
  duration = 2,
  className,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const node = ref.current;
    const formatter = new Intl.NumberFormat("en-US");

    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(value) {
        node.textContent = formatter.format(Math.round(value)) + suffix;
      },
    });

    return () => controls.stop();
  }, [inView, to, duration, suffix]);

  return (
    <span ref={ref} className={className}>
      0{suffix}
    </span>
  );
}
