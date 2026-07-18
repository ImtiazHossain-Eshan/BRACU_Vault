"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { categories } from "@/lib/data";
import { courseHref } from "@/lib/vault-data";
import type { CourseDetail } from "@/lib/types";

const CARD_W = 244;
const GAP = 22;
const STEP = CARD_W + GAP;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function RailCard({
  course,
  index,
  x,
  onActivate,
  movedRef,
}: {
  course: CourseDetail;
  index: number;
  x: ReturnType<typeof useMotionValue<number>>;
  onActivate: (i: number) => void;
  movedRef: React.MutableRefObject<boolean>;
}) {
  const router = useRouter();
  const cat = categories.find((c) => c.id === course.category);
  const delta = useTransform(x, (v) => index * STEP + v);

  const rotateY = useTransform(delta, (d) => clamp(-d * 0.05, -38, 38));
  const scale = useTransform(delta, (d) => clamp(1 - Math.abs(d) * 0.0012, 0.82, 1));
  const opacity = useTransform(delta, (d) => clamp(1 - Math.abs(d) * 0.0013, 0.45, 1));
  const zIndex = useTransform(delta, (d) => Math.round(200 - Math.abs(d) / 5));

  const topTypes = (Object.entries(course.counts) as [string, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <motion.div
      style={{ width: CARD_W, rotateY, scale, opacity, zIndex }}
      className="relative flex-shrink-0"
    >
      <motion.button
        onClick={() => {
          if (movedRef.current) return; // ignore click that ended a drag
          onActivate(index);
          router.push(courseHref(course.code));
        }}
        whileHover={{ y: -8 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        className="group relative block w-full overflow-hidden rounded-[1.6rem] glass-strong p-5 text-left shadow-soft"
        style={{ height: 188 }}
      >
        {/* glow edge on hover */}
        <span
          className="pointer-events-none absolute inset-0 rounded-[1.6rem] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ boxShadow: `inset 0 0 0 1.5px ${cat?.to}, 0 18px 50px -24px ${cat?.glow}` }}
        />
        <span
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: `linear-gradient(90deg, ${cat?.from}, ${cat?.to})` }}
        />

        <div className="flex h-full flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <span className="font-display text-2xl font-semibold tracking-tight text-fg">
                {course.code}
              </span>
              <span
                className="grid h-9 w-9 place-items-center rounded-xl text-xs font-bold text-bg"
                style={{ background: `linear-gradient(135deg, ${cat?.from}, ${cat?.to})` }}
              >
                {course.fileCount}
              </span>
            </div>
            <p className="mt-1.5 line-clamp-2 text-sm text-fg/55">{course.title}</p>
          </div>

          {/* breakdown reveals on hover */}
          <div className="flex flex-wrap gap-1.5">
            {topTypes.map(([k, n]) => (
              <span
                key={k}
                className="rounded-full border border-fg/10 bg-fg/[0.04] px-2 py-0.5 text-[10px] text-fg/55 transition-colors group-hover:border-fg/20"
              >
                {n} {k.toLowerCase()}
              </span>
            ))}
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
}

export default function ContinueRail({ courses }: { courses: CourseDetail[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const x = useMotionValue(0);
  const [active, setActive] = useState(0);
  const movedRef = useRef(false);

  const n = courses.length;
  const maxIndex = n - 1;
  const minX = -maxIndex * STEP;
  const pad = w > 0 ? Math.max(16, (w - CARD_W) / 2) : 16;

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  function snapTo(i: number) {
    const idx = clamp(i, 0, maxIndex);
    setActive(idx);
    animate(x, -idx * STEP, { type: "spring", stiffness: 260, damping: 30 });
  }

  return (
    <div className="relative">
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-30 w-16 bg-gradient-to-r from-bg to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-30 w-16 bg-gradient-to-l from-bg to-transparent" />

      <div ref={viewportRef} className="perspective overflow-hidden py-6">
        <motion.div
          className="flex cursor-grab items-center active:cursor-grabbing"
          style={{ x, gap: GAP, paddingLeft: pad, paddingRight: pad }}
          drag="x"
          dragConstraints={{ left: minX, right: 0 }}
          dragElastic={0.12}
          dragMomentum
          onDragStart={() => (movedRef.current = true)}
          onDragEnd={() => {
            const idx = clamp(Math.round(-x.get() / STEP), 0, maxIndex);
            snapTo(idx);
            // let the click handler see the drag, then clear
            setTimeout(() => (movedRef.current = false), 0);
          }}
        >
          {courses.map((c, i) => (
            <RailCard
              key={c.code}
              course={c}
              index={i}
              x={x}
              movedRef={movedRef}
              onActivate={snapTo}
            />
          ))}
        </motion.div>
      </div>

      {/* dot pager */}
      <div className="mt-1 flex items-center justify-center gap-2">
        {courses.map((c, i) => (
          <button
            key={c.code}
            aria-label={`Go to ${c.code}`}
            onClick={() => snapTo(i)}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: i === active ? 22 : 7,
              background: i === active ? "rgb(var(--accent))" : "rgb(var(--fg) / 0.2)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
