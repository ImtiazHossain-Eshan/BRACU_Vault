"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import dynamic from "next/dynamic";
import { useRef } from "react";
import MagneticButton from "./ui/MagneticButton";

// Heavy, client-only canvas — lazy loaded so it never blocks first paint.
const ParticleField = dynamic(() => import("./ParticleField"), { ssr: false });
const VaultCore = dynamic(() => import("./VaultCore"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto aspect-square w-full max-w-[34rem] animate-pulse rounded-full bg-fg/[0.03]" />
  ),
});

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] } },
};

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // gentle parallax drift on scroll
  const yText = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const yVisual = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-28 sm:pt-32"
    >
      <ParticleField />

      <div className="relative z-10 mx-auto grid w-full max-w-content grid-cols-1 items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr]">
        {/* copy */}
        <motion.div
          style={{ y: yText, opacity }}
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col items-start gap-7 text-left"
        >
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-fg/10 bg-fg/[0.03] px-4 py-1.5 text-xs font-medium tracking-[0.18em] text-fg/70"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-glow-cyan" />
            BRAC UNIVERSITY · COMPUTER SCIENCE
          </motion.span>

          <motion.h1
            variants={item}
            className="font-display text-[2.6rem] font-semibold leading-[1.02] tracking-tightest text-fg sm:text-6xl lg:text-[4.4rem]"
          >
            Every course.
            <br />
            Every resource.
            <br />
            <span className="text-gradient-accent animate-gradient-pan">
              One intelligent vault.
            </span>
          </motion.h1>

          <motion.p
            variants={item}
            className="max-w-xl text-base leading-relaxed text-fg/60 sm:text-lg"
          >
            13,000+ curated files across 39 courses: notes, slides, labs, past
            exams and full projects, organized the way your degree actually
            flows.
          </motion.p>

          <motion.div variants={item} className="flex flex-wrap items-center gap-3">
            <MagneticButton href="#curriculum">
              Explore the Vault
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <path
                  d="M5 12h14m0 0-6-6m6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </MagneticButton>
            <MagneticButton href="/orbit" variant="ghost">
              Explore the orbit
            </MagneticButton>
          </motion.div>

          <motion.div
            variants={item}
            className="flex items-center gap-6 pt-2 text-sm text-fg/45"
          >
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-highlight" />
              Updated every semester
            </span>
            <span className="hidden items-center gap-2 sm:flex">
              <span className="h-2 w-2 rounded-full bg-accent-2" />
              Theory + Lab for every course
            </span>
          </motion.div>
        </motion.div>

        {/* 3D vault visual */}
        <motion.div style={{ y: yVisual }} className="relative">
          <VaultCore />
        </motion.div>
      </div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2"
      >
        <div className="flex h-9 w-5 items-start justify-center rounded-full border border-fg/20 p-1.5">
          <motion.span
            animate={{ y: [0, 8, 0], opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="h-1.5 w-1.5 rounded-full bg-fg"
          />
        </div>
      </motion.div>
    </section>
  );
}
