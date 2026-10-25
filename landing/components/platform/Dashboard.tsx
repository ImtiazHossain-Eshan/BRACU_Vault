"use client";

import { motion, useTransform } from "framer-motion";
import Link from "next/link";
import { useMemo } from "react";
import { distributionByType } from "@/lib/filters";
import type { VaultFile } from "@/lib/types";
import { allFiles, getCourse, getFileById } from "@/lib/vault-data";
import { useMounted } from "@/hooks/useMounted";
import { usePointerParallax } from "@/hooks/usePointerParallax";
import { useDeviceTier } from "@/hooks/useDeviceTier";
import { useVaultStore } from "@/store/useVaultStore";
import AmbientField from "./dashboard/AmbientField";
import ContinueRail from "./dashboard/ContinueRail";
import SmartGrid from "./dashboard/SmartGrid";
import VaultPulse from "./dashboard/VaultPulse";

function Heading({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-5 flex items-baseline justify-between">
      <h2 className="font-display text-xl font-semibold text-fg">{children}</h2>
      {hint && <span className="text-xs text-fg/40">{hint}</span>}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-fg/15 px-6 py-10 text-center text-sm text-fg/45">
      {children}
    </div>
  );
}

const section = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.15 + i * 0.12, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export default function Dashboard() {
  const mounted = useMounted();
  const caps = useDeviceTier();
  const recents = useVaultStore((s) => s.recentCourses);
  const bookmarks = useVaultStore((s) => s.bookmarks);
  const { px, py, onMouseMove, onMouseLeave } = usePointerParallax(caps.enableParallax);

  // gentle parallax on the heading block
  const headX = useTransform(px, (v) => v * 10);
  const headY = useTransform(py, (v) => v * 8);

  const savedFiles = useMemo(
    () => bookmarks.map(getFileById).filter(Boolean) as VaultFile[],
    [bookmarks]
  );
  const recentCourses = useMemo(
    () => recents.map(getCourse).filter((c): c is NonNullable<typeof c> => !!c),
    [recents]
  );
  const dist = useMemo(
    () => distributionByType(savedFiles.length ? savedFiles : allFiles),
    [savedFiles]
  );

  return (
    <section
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative min-h-screen px-5 pb-28 pt-28 sm:px-8 sm:pt-32"
    >
      <AmbientField px={px} py={py} animate={caps.enableAmbient} />

      <div className="mx-auto max-w-content">
        {/* header */}
        <motion.div style={{ x: headX, y: headY }}>
          <motion.span
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-accent"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Your space
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.06 }}
            className="mt-2 font-display text-4xl font-semibold tracking-tight text-fg sm:text-5xl"
          >
            Command Center
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-3 max-w-xl text-base text-fg/55"
          >
            Everything you&apos;ve touched and everything you should see next,
            stored locally, just for you.
          </motion.p>
        </motion.div>

        {!mounted ? (
          <div className="mt-12 h-56 animate-pulse rounded-3xl bg-fg/[0.04]" />
        ) : (
          <div className="mt-14 flex flex-col gap-16">
            {/* continue - floating rail */}
            <motion.section custom={0} variants={section} initial="hidden" animate="show">
              <Heading hint={`${recentCourses.length} recent`}>
                Continue where you left off
              </Heading>
              {recentCourses.length === 0 ? (
                <EmptyHint>
                  Open any course and it&apos;ll float up here.{" "}
                  <Link href="/orbit" className="text-accent hover:underline">
                    Start exploring →
                  </Link>
                </EmptyHint>
              ) : (
                <ContinueRail courses={recentCourses} />
              )}
            </motion.section>

            {/* saved + pulse */}
            <motion.div
              custom={1}
              variants={section}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_20rem]"
            >
              <div>
                <Heading hint={`${savedFiles.length} saved`}>Saved files</Heading>
                {savedFiles.length === 0 ? (
                  <EmptyHint>
                    Tap the bookmark on any file to keep it floating here for later.
                  </EmptyHint>
                ) : (
                  <SmartGrid files={savedFiles} />
                )}
              </div>
              <aside className="lg:sticky lg:top-28 lg:self-start">
                <VaultPulse
                  data={dist}
                  title={savedFiles.length ? "Your saved mix" : "Vault at a glance"}
                />
              </aside>
            </motion.div>

          </div>
        )}
      </div>
    </section>
  );
}
