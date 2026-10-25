"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { projects } from "@/lib/data";
import SectionHeading from "./ui/SectionHeading";
import Sheen from "./ui/Sheen";

export default function FeaturedProjects() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragWidth, setDragWidth] = useState(0);
  // Where the pointer went down on a card, so a drag-to-scroll isn't mistaken
  // for a click that navigates to the repo.
  const pressRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const measure = () => {
      const el = trackRef.current;
      if (!el) return;
      setDragWidth(Math.max(0, el.scrollWidth - el.offsetWidth));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <section id="projects" className="relative scroll-mt-24 overflow-hidden py-24 sm:py-32">
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            align="left"
            eyebrow="Featured Work"
            title={
              <>
                Projects that{" "}
                <span className="text-gradient">tell a story</span>
              </>
            }
          />
          <p className="hidden items-center gap-2 text-sm text-fg/40 sm:flex">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
              <path
                d="M8 12h8m0 0-3-3m3 3-3 3M3 5v14m18-14v14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Drag to explore
          </p>
        </div>
      </div>

      {/* draggable track with inertia */}
      <div className="mt-12 cursor-grab overflow-hidden px-5 active:cursor-grabbing sm:px-8">
        <motion.div
          ref={trackRef}
          drag="x"
          dragConstraints={{ left: -dragWidth, right: 0 }}
          dragElastic={0.08}
          dragTransition={{ power: 0.3, timeConstant: 240, bounceStiffness: 300, bounceDamping: 40 }}
          className="mx-auto flex w-max max-w-content gap-6"
        >
          {projects.map((p, i) => (
            <motion.a
              key={p.title}
              href={p.href}
              target="_blank"
              rel="noreferrer"
              draggable={false}
              onPointerDown={(e) => {
                pressRef.current = { x: e.clientX, y: e.clientY };
              }}
              onClick={(e) => {
                const s = pressRef.current;
                // If the pointer traveled more than a few px, this was a
                // drag-to-scroll, not a click - don't open the repo.
                if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) > 8) {
                  e.preventDefault();
                }
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              whileHover={{ y: -6 }}
              className="group relative block h-[26rem] w-[80vw] flex-shrink-0 overflow-hidden rounded-[2rem] glass sm:w-[30rem]"
            >
              <Sheen />
              {/* cinematic gradient "cover" (color-mix keeps it theme-aware) */}
              <div
                className="absolute inset-0 opacity-90 transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: `radial-gradient(120% 120% at 20% 10%, color-mix(in srgb, ${p.from} 24%, transparent), transparent 55%), radial-gradient(120% 120% at 90% 90%, color-mix(in srgb, ${p.to} 28%, transparent), transparent 55%)`,
                }}
              />
              {/* drifting orb */}
              <div
                className="absolute -right-10 top-10 h-40 w-40 rounded-full opacity-50 blur-3xl animate-float-slow"
                style={{ background: `radial-gradient(circle, ${p.from}, transparent 70%)` }}
              />

              <div className="relative flex h-full flex-col justify-between p-7 sm:p-8">
                <div className="flex items-center justify-between">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold text-bg"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${p.from}, ${p.to})`,
                    }}
                  >
                    {p.course}
                  </span>
                  <span className="text-xs uppercase tracking-[0.2em] text-fg/45">
                    {p.field}
                  </span>
                </div>

                <div>
                  <h3 className="font-display text-3xl font-semibold leading-tight text-fg">
                    {p.title}
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-fg/60">
                    {p.blurb}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-fg/15 bg-fg/[0.04] px-3 py-1 text-xs text-fg/70"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center gap-2 text-sm font-medium text-fg/80">
                    View project
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
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
                </div>
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
