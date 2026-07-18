"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/* --------------------------------------------------------------------------
 * The mark — an abstract "knowledge vault":
 *   - a faceted hexagon (structure · depth · precision); its lower edges
 *     already form a downward V → the Vault.
 *   - two nested chevrons = stacked knowledge / archive layers, converging
 *     on a gold keystone node = the core of knowledge.
 * Geometry is built on a 48-unit grid for optical balance.
 * ------------------------------------------------------------------------ */

const HEX = "M24 6 L39.6 15 L39.6 33 L24 42 L8.4 33 L8.4 15 Z";
const CHEVRON_OUTER = "M13 17 L24 28 L35 17";
const CHEVRON_INNER = "M17.5 15 L24 22 L30.5 15";

export type MarkTone = "brand" | "cream" | "mono";

interface MarkColors {
  hex: string;
  chevron: string;
  node: string;
}

function toneColors(tone: MarkTone): MarkColors {
  switch (tone) {
    case "brand":
      // canonical identity — Paper palette
      return { hex: "#4A3A2A", chevron: "#8B6F47", node: "#C2A878" };
    case "cream":
      // monochrome on the brand gradient tile (inherits currentColor)
      return { hex: "currentColor", chevron: "currentColor", node: "currentColor" };
    case "mono":
    default:
      return { hex: "currentColor", chevron: "currentColor", node: "currentColor" };
  }
}

interface VaultMarkProps {
  tone?: MarkTone;
  animated?: boolean;
  className?: string;
  /** restart key — change it to replay the draw-in */
  replayKey?: string | number;
}

export function VaultMark({
  tone = "brand",
  animated = false,
  className,
  replayKey,
}: VaultMarkProps) {
  const reduce = useReducedMotion();
  const play = animated && !reduce;
  const c = toneColors(tone);

  const drawTransition = (i: number): Transition => ({
    duration: 0.85,
    delay: 0.1 + i * 0.28,
    ease: [0.4, 0, 0.2, 1],
  });

  const strokeProps = {
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      key={replayKey}
      viewBox="0 0 48 48"
      className={className}
      aria-hidden
      {...strokeProps}
    >
      {/* hexagon — the vault structure */}
      <motion.path
        d={HEX}
        stroke={c.hex}
        strokeWidth={2.4}
        initial={play ? { pathLength: 0, opacity: 0 } : false}
        animate={play ? { pathLength: 1, opacity: 1 } : undefined}
        transition={play ? drawTransition(0) : undefined}
        {...strokeProps}
      />
      {/* nested chevrons — stacked knowledge layers */}
      <motion.path
        d={CHEVRON_OUTER}
        stroke={c.chevron}
        strokeWidth={2.2}
        initial={play ? { pathLength: 0, opacity: 0 } : false}
        animate={play ? { pathLength: 1, opacity: 1 } : undefined}
        transition={play ? drawTransition(1) : undefined}
        {...strokeProps}
      />
      <motion.path
        d={CHEVRON_INNER}
        stroke={c.chevron}
        strokeWidth={2.2}
        initial={play ? { pathLength: 0, opacity: 0 } : false}
        animate={play ? { pathLength: 1, opacity: 1 } : undefined}
        transition={play ? drawTransition(2) : undefined}
        {...strokeProps}
      />
      {/* keystone node — the knowledge core */}
      <motion.circle
        cx={24}
        cy={28}
        r={2.6}
        fill={c.node}
        style={{ transformOrigin: "24px 28px" }}
        initial={play ? { scale: 0, opacity: 0 } : false}
        animate={play ? { scale: 1, opacity: 1 } : undefined}
        transition={
          play ? { delay: 1.0, type: "spring", stiffness: 320, damping: 13 } : undefined
        }
      />
    </svg>
  );
}

/* --------------------------------------------------------------------------
 * The wordmark + lockups.
 * ------------------------------------------------------------------------ */

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display leading-none", className)}>
      <span className="font-semibold tracking-[0.045em] text-fg">BRACU</span>
      <span className="font-medium tracking-[0.02em] text-fg/55"> Vault</span>
    </span>
  );
}

interface LogoProps {
  variant?: "lockup" | "stacked" | "icon";
  /** show the brand-gradient tile behind the mark (navbar/footer style) */
  tile?: boolean;
  animated?: boolean;
  href?: string;
  /** icon edge length in px */
  iconSize?: number;
  className?: string;
  wordClassName?: string;
}

export default function Logo({
  variant = "lockup",
  tile = true,
  animated = false,
  href,
  iconSize = 36,
  className,
  wordClassName,
}: LogoProps) {
  const mark = tile ? (
    <span
      className="relative grid flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br from-highlight via-accent to-accent-2 text-bg shadow-glow"
      style={{ width: iconSize, height: iconSize }}
    >
      <VaultMark
        tone="cream"
        animated={animated}
        className="h-[66%] w-[66%]"
      />
    </span>
  ) : (
    <VaultMark
      tone="brand"
      animated={animated}
      className=""
      // size controlled via wrapper below
    />
  );

  const markBox = tile ? (
    mark
  ) : (
    <span
      className="grid flex-shrink-0 place-items-center"
      style={{ width: iconSize, height: iconSize }}
    >
      {mark}
    </span>
  );

  const content: ReactNode =
    variant === "icon" ? (
      markBox
    ) : variant === "stacked" ? (
      <span className="flex flex-col items-center gap-3">
        {markBox}
        <Wordmark className={cn("text-lg", wordClassName)} />
      </span>
    ) : (
      <span className="flex items-center gap-2.5">
        {markBox}
        <Wordmark className={cn("text-lg", wordClassName)} />
      </span>
    );

  if (href) {
    return (
      <a href={href} className={cn("group inline-flex", className)} aria-label="BRACU Vault">
        {content}
      </a>
    );
  }
  return (
    <span className={cn("inline-flex", className)} aria-label="BRACU Vault">
      {content}
    </span>
  );
}
