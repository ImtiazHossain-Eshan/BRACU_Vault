"use client";

import { motion } from "framer-motion";
import MagneticButton from "./ui/MagneticButton";

export default function CTA() {
  return (
    <section id="cta" className="relative scroll-mt-24 py-28 sm:py-36">
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden rounded-[2.5rem] glass-strong px-6 py-16 text-center sm:px-12 sm:py-20"
        >
          {/* layered glows */}
          <div className="ink-wash-1 pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full blur-3xl opacity-60 animate-aurora" />
          <div className="ink-wash-2 pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full blur-3xl opacity-60 animate-aurora [animation-delay:-9s]" />
          {/* animated conic ring */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 animate-spin-slow"
            style={{
              background:
                "conic-gradient(from 0deg, transparent, rgb(var(--accent-2) / 0.6), transparent 30%)",
            }}
          />

          <div className="relative mx-auto max-w-2xl">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 rounded-full border border-fg/10 bg-fg/[0.03] px-4 py-1.5 text-xs font-medium uppercase tracking-[0.22em] text-fg/60"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-glow-cyan" />
              Start now · free for BRACU students
            </motion.span>

            <h2 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tightest text-fg sm:text-6xl">
              Step into the{" "}
              <span className="text-gradient-accent animate-gradient-pan">vault</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-fg/60 sm:text-lg">
              Your entire CSE journey: searchable, organized and beautiful.
              Open it once and you’ll never study scattered again.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <MagneticButton href="/orbit">
                Enter the Vault
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
              <MagneticButton href="/dashboard" variant="ghost">
                Your dashboard
              </MagneticButton>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
