"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import type { MouseEvent } from "react";
import { categories, countByCategory, courses, type Category } from "@/lib/data";
import SectionHeading from "./ui/SectionHeading";
import Sheen from "./ui/Sheen";
import Reveal from "./ui/Reveal";

function TiltCard({ category, index }: { category: Category; index: number }) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 150, damping: 15 });
  const sry = useSpring(ry, { stiffness: 150, damping: 15 });
  const rotateX = useTransform(srx, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(sry, [-0.5, 0.5], [-12, 12]);

  function handleMove(e: MouseEvent<HTMLAnchorElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    rx.set((e.clientY - rect.top) / rect.height - 0.5);
    ry.set((e.clientX - rect.left) / rect.width - 0.5);
  }
  function reset() {
    rx.set(0);
    ry.set(0);
  }

  const peek = courses
    .filter((c) => c.category === category.id)
    .slice(0, 4)
    .map((c) => c.code);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay: index * 0.1 }}
      // staggered arc: lift alternating cards so it never reads as a plain grid
      className={index % 2 === 1 ? "lg:mt-16" : ""}
    >
      <motion.a
        href="/orbit"
        onMouseMove={handleMove}
        onMouseLeave={reset}
        style={{ rotateX, rotateY, transformPerspective: 900 }}
        whileHover={{ y: -8 }}
        className="group preserve-3d relative block overflow-hidden rounded-[2rem] glass p-7 transition-shadow duration-300 hover:shadow-glow sm:p-8"
      >
        <Sheen />
        {/* gradient glow wash */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-40 blur-3xl transition-opacity duration-500 group-hover:opacity-80"
          style={{
            background: `radial-gradient(circle, ${category.glow}, transparent 70%)`,
          }}
        />

        <div className="relative flex items-start justify-between">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-semibold text-bg"
            style={{
              backgroundImage: `linear-gradient(135deg, ${category.from}, ${category.to})`,
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="font-display text-5xl font-semibold tracking-tightest text-fg/90">
            {countByCategory(category.id)}
            <span className="ml-1 align-top text-base font-normal text-fg/40">
              courses
            </span>
          </span>
        </div>

        <h3 className="relative mt-7 font-display text-2xl font-semibold text-fg">
          {category.label}
        </h3>
        <p className="relative mt-1 text-sm font-medium text-accent">
          {category.tagline}
        </p>
        <p className="relative mt-3 text-sm leading-relaxed text-fg/55">
          {category.description}
        </p>

        <div className="relative mt-6 flex flex-wrap gap-2">
          {peek.map((code) => (
            <span
              key={code}
              className="rounded-full border border-fg/10 bg-fg/[0.03] px-3 py-1 text-xs text-fg/60"
            >
              {code}
            </span>
          ))}
          <span className="rounded-full border border-fg/10 bg-fg/[0.03] px-3 py-1 text-xs text-fg/40">
            +more
          </span>
        </div>

        <div className="relative mt-7 flex items-center gap-2 text-sm font-medium text-fg/70 transition-colors group-hover:text-fg">
          Explore archive
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
            fill="none"
          >
            <path
              d="M5 12h14m0 0-6-6m6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </motion.a>
    </motion.div>
  );
}

export default function Curriculum() {
  return (
    <section id="curriculum" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <SectionHeading
          eyebrow="The Structure"
          title={
            <>
              Four pillars,{" "}
              <span className="text-gradient">one degree</span>
            </>
          }
          subtitle="The vault mirrors your curriculum exactly, from the core CS spine to the breadth of General Education. Hover to feel the depth."
        />

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {categories.map((category, i) => (
            <TiltCard key={category.id} category={category} index={i} />
          ))}
        </div>

        <Reveal className="mt-14 flex justify-center" delay={0.1}>
          <a
            href="/orbit"
            className="group inline-flex items-center gap-2.5 rounded-full glass px-6 py-3.5 text-sm font-semibold text-fg transition-shadow hover:shadow-glow"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
            </span>
            Explore the curriculum in 3D
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
            >
              <path
                d="M5 12h14m0 0-6-6m6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
