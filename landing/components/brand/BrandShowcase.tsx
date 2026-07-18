"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Logo, { VaultMark, Wordmark } from "./Logo";

const palette = [
  { name: "Deep Brown", hex: "#4A3A2A", role: "Primary · ink", text: "#F8F5F0" },
  { name: "Soft Brown", hex: "#8B6F47", role: "Secondary · structure", text: "#F8F5F0" },
  { name: "Muted Gold", hex: "#C2A878", role: "Accent · keystone", text: "#4A3A2A" },
  { name: "Paper", hex: "#F8F5F0", role: "Ground · beige", text: "#4A3A2A" },
];

function Panel({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-4 rounded-[1.75rem] glass p-6 sm:p-8 ${className ?? ""}`}>
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-fg/45">
        {label}
      </span>
      {children}
    </div>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-content px-5 py-12 sm:px-8">
      <div className="mb-8 flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.22em] text-accent">
          {eyebrow}
        </span>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

export default function BrandShowcase() {
  const [replay, setReplay] = useState(0);

  return (
    <main className="relative min-h-screen pb-24">

      {/* top bar */}
      <div className="mx-auto flex max-w-content items-center justify-between px-5 py-6 sm:px-8">
        <Logo href="/" iconSize={34} />
        <a
          href="/"
          className="rounded-full glass px-4 py-2 text-sm text-fg/70 transition-colors hover:text-fg"
        >
          ← Back to site
        </a>
      </div>

      {/* hero */}
      <section className="mx-auto flex max-w-content flex-col items-center px-5 py-16 text-center sm:px-8 sm:py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative grid h-44 w-44 place-items-center rounded-[2rem] glass shadow-glow"
        >
          <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_50%_40%,var(--c-core-glow),transparent_70%)]" />
          <VaultMark
            tone="brand"
            animated
            replayKey={replay}
            className="relative h-28 w-28"
          />
        </motion.div>

        <h1 className="mt-10 font-display text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
          <Wordmark className="text-4xl sm:text-5xl" />
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-fg/55">
          A faceted vault holding stacked layers of knowledge that converge on a
          single keystone. Quiet, geometric, timeless, a knowledge institution,
          not a gimmick.
        </p>

        <button
          onClick={() => setReplay((n) => n + 1)}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-fg px-5 py-2.5 text-sm font-semibold text-bg transition-transform hover:scale-[1.03]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
            <path
              d="M4 12a8 8 0 1 0 2.3-5.6M4 4v3.5h3.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Replay animation
        </button>
      </section>

      {/* the mark */}
      <Section eyebrow="The Mark" title="One symbol, three renderings">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Panel label="Primary">
            <div className="grid h-44 place-items-center rounded-2xl bg-[#F8F5F0]">
              <VaultMark tone="brand" className="h-24 w-24" />
            </div>
          </Panel>
          <Panel label="On gradient tile">
            <div className="grid h-44 place-items-center rounded-2xl bg-bg-2">
              <span className="grid h-24 w-24 place-items-center rounded-2xl bg-gradient-to-br from-highlight via-accent to-accent-2 text-bg shadow-glow">
                <VaultMark tone="cream" className="h-16 w-16" />
              </span>
            </div>
          </Panel>
          <Panel label="Monochrome">
            <div className="grid h-44 place-items-center rounded-2xl bg-[#4A3A2A] text-[#F8F5F0]">
              <VaultMark tone="mono" className="h-24 w-24" />
            </div>
          </Panel>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 text-sm text-fg/55 sm:grid-cols-3">
          <p>
            <span className="font-semibold text-fg">Hexagon</span>: structure,
            depth and precision; its lower edges form the vault’s V.
          </p>
          <p>
            <span className="font-semibold text-fg">Nested chevrons</span>:
            stacked knowledge / archive layers, converging inward.
          </p>
          <p>
            <span className="font-semibold text-fg">Keystone node</span>: the
            core of knowledge held at the centre of the vault.
          </p>
        </div>
      </Section>

      {/* logotype */}
      <Section eyebrow="Logotype" title="Refined, institutional, quiet">
        <Panel label="Wordmark">
          <div className="grid place-items-center py-10">
            <Wordmark className="text-4xl sm:text-6xl" />
          </div>
          <p className="text-sm leading-relaxed text-fg/55">
            Set in <span className="text-fg">Space Grotesk</span>. “BRACU” in
            semibold with open <span className="text-fg">+0.045em</span> tracking
            for an institutional, archival feel; “Vault” in medium and muted to
            recede, confidence without volume.
          </p>
        </Panel>
      </Section>

      {/* lockups */}
      <Section eyebrow="Lockups" title="Horizontal & stacked">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Panel label="Horizontal">
            <div className="grid h-40 place-items-center">
              <Logo variant="lockup" iconSize={44} wordClassName="text-2xl" />
            </div>
          </Panel>
          <Panel label="Stacked">
            <div className="grid h-40 place-items-center">
              <Logo variant="stacked" iconSize={52} wordClassName="text-xl" />
            </div>
          </Panel>
        </div>
      </Section>

      {/* colour system */}
      <Section eyebrow="Colour System" title="Paper & ink">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {palette.map((c) => (
            <div
              key={c.hex}
              className="flex flex-col justify-between rounded-2xl p-5 shadow-soft"
              style={{ background: c.hex, color: c.text, minHeight: "9.5rem" }}
            >
              <span className="text-sm font-semibold">{c.name}</span>
              <span>
                <span className="block text-xs opacity-70">{c.role}</span>
                <span className="mt-1 block font-mono text-sm tracking-wide">
                  {c.hex}
                </span>
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* favicon */}
      <Section eyebrow="Favicon" title="Legible at any size">
        <Panel label="App icon · 48 / 32 / 16 px">
          <div className="flex flex-wrap items-end gap-8 py-6">
            {[48, 32, 16].map((s) => (
              <div key={s} className="flex flex-col items-center gap-3">
                <span className="grid place-items-center rounded-[28%] bg-gradient-to-br from-highlight via-accent to-accent-2 text-bg shadow-glow" style={{ width: s, height: s }}>
                  <VaultMark tone="cream" className="h-[64%] w-[64%]" />
                </span>
                <span className="text-xs text-fg/40">{s}px</span>
              </div>
            ))}

            {/* browser-tab mock */}
            <div className="ml-auto flex items-center gap-2 rounded-t-xl glass px-3 py-2">
              <span className="grid h-4 w-4 place-items-center rounded-[28%] bg-gradient-to-br from-highlight via-accent to-accent-2 text-bg">
                <VaultMark tone="cream" className="h-2.5 w-2.5" />
              </span>
              <span className="text-xs text-fg/70">BRACU Vault</span>
              <span className="text-fg/30">×</span>
            </div>
          </div>
        </Panel>
      </Section>

      {/* construction */}
      <Section eyebrow="Construction" title="Geometry & clear space">
        <Panel label="Built on a 48-unit grid">
          <div className="surface-grid grid place-items-center rounded-2xl bg-bg-2 py-12 [background-size:24px_24px]">
            <div className="relative grid h-44 w-44 place-items-center">
              {/* clear-space ring */}
              <span className="absolute inset-0 rounded-full border border-dashed border-fg/20" />
              <VaultMark tone="brand" className="h-28 w-28" />
            </div>
          </div>
          <p className="text-sm leading-relaxed text-fg/55">
            Keep clear space equal to the keystone’s diameter on every side. Never
            recolour the keystone, rotate the mark, or stretch the hexagon.
          </p>
        </Panel>
      </Section>

      {/* motion */}
      <Section eyebrow="Motion" title="Lines draw like ink, the vault assembles">
        <Panel label="Framer Motion concept">
          <div className="grid place-items-center py-10">
            <VaultMark tone="brand" animated replayKey={`m-${replay}`} className="h-28 w-28" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-xl text-sm leading-relaxed text-fg/55">
              The hexagon strokes in first, the chevrons follow in sequence, and
              the keystone springs in last with a soft settle. Honors
              <span className="text-fg"> prefers-reduced-motion</span> by rendering
              the final state instantly.
            </p>
            <button
              onClick={() => setReplay((n) => n + 1)}
              className="rounded-full glass px-4 py-2 text-sm text-fg/80 transition-colors hover:text-fg"
            >
              Replay
            </button>
          </div>
        </Panel>
      </Section>
    </main>
  );
}
