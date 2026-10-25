/**
 * Fixed, GPU-cheap cinematic backdrop shared across the whole page.
 * Theme-aware via CSS variables:
 *   - light "Paper": warm grid, gold/brown ink-wash, paper grain, drifting sheets
 *   - dark "Archive": charcoal depth, barely-visible amber/olive washes, film
 *     grain, volumetric light beams, drifting dust, and edge-lit slabs
 *     emerging from shadow.
 * Pure CSS - no JS cost.
 */
const fragments = [
  { top: "18%", left: "8%", w: "8rem", h: "10rem", rotate: "-12deg", delay: "0s" },
  { top: "62%", left: "82%", w: "7rem", h: "9rem", rotate: "9deg", delay: "-4s" },
  { top: "78%", left: "14%", w: "6rem", h: "8rem", rotate: "-6deg", delay: "-8s" },
];

const dust = [
  { top: "22%", left: "18%", s: 3, delay: "0s", dur: "13s" },
  { top: "34%", left: "72%", s: 2, delay: "-3s", dur: "17s" },
  { top: "55%", left: "40%", s: 2.5, delay: "-6s", dur: "15s" },
  { top: "68%", left: "60%", s: 2, delay: "-2s", dur: "19s" },
  { top: "80%", left: "30%", s: 3, delay: "-9s", dur: "14s" },
  { top: "44%", left: "88%", s: 2, delay: "-5s", dur: "18s" },
  { top: "12%", left: "52%", s: 2.5, delay: "-7s", dur: "16s" },
  { top: "90%", left: "78%", s: 2, delay: "-1s", dur: "20s" },
];

export default function Atmosphere() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg"
    >
      {/* perspective grid */}
      <div className="surface-grid absolute inset-0 [background-size:64px_64px] [mask-image:radial-gradient(circle_at_50%_30%,#000_0%,transparent_75%)]" />

      {/* ink-wash / warm washes (barely visible in dark) */}
      <div className="ink-wash-1 absolute -left-40 top-[-10%] h-[42rem] w-[42rem] rounded-full opacity-70 blur-3xl animate-aurora" />
      <div className="ink-wash-2 absolute right-[-15%] top-[20%] h-[40rem] w-[40rem] rounded-full opacity-60 blur-3xl animate-aurora [animation-delay:-8s]" />
      <div className="ink-wash-1 absolute bottom-[-20%] left-1/3 h-[36rem] w-[36rem] rounded-full opacity-40 blur-3xl animate-aurora [animation-delay:-14s]" />

      {/* volumetric light beams (dark only via --beam-opacity) */}
      <div
        className="absolute -top-1/4 left-[12%] h-[150%] w-[22rem] -rotate-[18deg] blur-2xl animate-float-slow"
        style={{
          opacity: "var(--beam-opacity)",
          background:
            "linear-gradient(180deg, rgba(232,225,217,0.06), rgba(193,122,43,0.04) 45%, transparent 75%)",
        }}
      />
      <div
        className="absolute -top-1/4 right-[18%] h-[140%] w-[16rem] rotate-[14deg] blur-2xl animate-float [animation-delay:-5s]"
        style={{
          opacity: "var(--beam-opacity)",
          background:
            "linear-gradient(180deg, rgba(232,225,217,0.05), transparent 70%)",
        }}
      />

      {/* slabs / archive shelves emerging from shadow (warm paper in light, graphite in dark) */}
      {fragments.map((f, i) => (
        <div
          key={i}
          className="absolute animate-float-slow rounded-[1.25rem] bg-bg-2 shadow-soft [border:1px_solid_var(--glass-border)]"
          style={{
            top: f.top,
            left: f.left,
            width: f.w,
            height: f.h,
            transform: `rotate(${f.rotate})`,
            opacity: "var(--fragment-opacity)",
            animationDelay: f.delay,
          }}
        />
      ))}

      {/* drifting dust motes (dark only via --dust-opacity) */}
      <div className="absolute inset-0" style={{ opacity: "var(--dust-opacity)" }}>
        {dust.map((d, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-[#E8E1D9] blur-[1px] animate-float-slow"
            style={{
              top: d.top,
              left: d.left,
              width: d.s,
              height: d.s,
              opacity: 0.5,
              animationDelay: d.delay,
              animationDuration: d.dur,
            }}
          />
        ))}
      </div>

      {/* film grain / paper noise (blend mode swaps per theme) */}
      <div className="paper-grain absolute inset-0 animate-grain" />

      {/* vignette to keep text legible */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: "var(--vignette)" }}
      />
    </div>
  );
}
