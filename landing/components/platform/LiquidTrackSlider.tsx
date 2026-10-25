"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/cn";

interface LiquidTrackSliderProps {
  section: string;
  onSelect: (track: "Python" | "Java") => void;
  className?: string;
}

export default function LiquidTrackSlider({
  section,
  onSelect,
  className,
}: LiquidTrackSliderProps) {
  const isPython = section.toLowerCase() === "python";
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className={cn("relative inline-flex items-center gap-3 select-none", className)}>
      <span className="font-mono text-[11px] font-medium tracking-[0.2em] uppercase text-fg/45">
        Track:
      </span>

      {/* Main tactile liquid-chrome pill */}
      <div
        className="relative group p-[2px] rounded-full transition-transform active:scale-[0.985] cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="group"
        aria-label="Course language track selector"
        style={{
          // Refractive liquid-chrome outer tube rim
          background:
            "linear-gradient(172deg, rgba(255,255,255,0.75) 0%, rgba(185,190,205,0.45) 24%, rgba(65,68,78,0.7) 48%, rgba(240,242,250,0.8) 72%, rgba(40,42,50,0.9) 100%)",
          boxShadow: isHovered
            ? "0 18px 42px -10px rgba(0,0,0,0.95), 0 0 28px -4px rgba(255,138,40,0.35), inset 0 1px 2px rgba(255,255,255,0.85), inset 0 -2px 3px rgba(0,0,0,0.85)"
            : "0 14px 34px -12px rgba(0,0,0,0.85), inset 0 1px 2px rgba(255,255,255,0.75), inset 0 -2px 3px rgba(0,0,0,0.85)",
          transition: "box-shadow 0.35s cubic-bezier(0.16, 0.84, 0.3, 1), transform 0.15s ease",
        }}
      >
        {/* Subtle ambient light cast onto the backdrop on hover */}
        <div
          className="pointer-events-none absolute -inset-3 rounded-full opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(circle, rgba(255,138,40,0.3) 0%, rgba(255,138,40,0.08) 45%, transparent 70%)",
          }}
        />

        {/* Liquid-metal tubular inner border */}
        <div
          className="relative flex items-center h-[46px] rounded-full overflow-hidden px-1"
          style={{
            // Dark brushed graphite chassis with noise & mica flecks
            background:
              "radial-gradient(ellipse at 50% 0%, #323238 0%, #202024 55%, #141416 100%)",
            border: "1px solid rgba(255,255,255,0.14)",
          }}
        >
          {/* Subtle mica sparkle texture simulation */}
          <div
            className="pointer-events-none absolute inset-0 opacity-25 mix-blend-screen"
            style={{
              backgroundImage:
                "radial-gradient(#ffffff 0.75px, transparent 0.75px), radial-gradient(#ffe3c2 0.5px, transparent 0.5px)",
              backgroundSize: "8px 8px, 13px 13px",
              backgroundPosition: "0 0, 4px 6px",
            }}
          />

          {/* Sliding amber crystal knob */}
          <motion.div
            className="absolute top-1 bottom-1 w-[96px] rounded-full z-10 pointer-events-none"
            initial={false}
            animate={{
              left: isPython ? "4px" : "calc(100% - 100px)",
            }}
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 32,
              mass: 0.8,
            }}
          >
            {/* Crystal knob 3D refraction sphere */}
            <div
              className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center shadow-lg"
              style={{
                background:
                  "radial-gradient(circle at 35% 25%, #ffffff 0%, #ffa534 24%, #d95e0a 58%, #3e1200 100%)",
                boxShadow:
                  "0 0 20px 2px rgba(255,138,40,0.55), 0 6px 14px rgba(0,0,0,0.65), inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -3px 6px rgba(0,0,0,0.6)",
              }}
            >
              {/* Internal shard/facet reflection */}
              <div
                className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, transparent 45%, rgba(255,255,255,0.5) 100%)",
                }}
              />
              {/* Top glint */}
              <div
                className="absolute top-1 left-2.5 right-2.5 h-[9px] rounded-full opacity-70 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0) 100%)",
                }}
              />
              {/* Floating amber embers in crystal */}
              <span className="absolute w-1 h-1 rounded-full bg-white/80 blur-[0.5px] top-2.5 right-4 animate-pulse" />
              <span className="absolute w-0.5 h-0.5 rounded-full bg-amber-100 top-5 left-5 opacity-75" />
            </div>
          </motion.div>

          {/* Python Button Option */}
          <button
            type="button"
            onClick={() => onSelect("Python")}
            className={cn(
              "relative z-20 flex items-center justify-center gap-2 h-full w-[96px] rounded-full transition-colors duration-200 outline-none",
              isPython
                ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                : "text-zinc-400 hover:text-zinc-200"
            )}
            aria-pressed={isPython}
          >
            <img
              src="/icons/python.png"
              alt=""
              className="h-3.5 w-3.5 object-contain relative z-20"
            />
            <span
              className={cn(
                "font-mono text-[11px] font-medium tracking-[0.16em] uppercase relative z-20",
                isPython ? "font-semibold text-white" : "text-zinc-400"
              )}
            >
              Python
            </span>
          </button>

          {/* Java Button Option */}
          <button
            type="button"
            onClick={() => onSelect("Java")}
            className={cn(
              "relative z-20 flex items-center justify-center gap-2 h-full w-[96px] rounded-full transition-colors duration-200 outline-none",
              !isPython
                ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                : "text-zinc-400 hover:text-zinc-200"
            )}
            aria-pressed={!isPython}
          >
            <img
              src="/icons/java.png"
              alt=""
              className="h-3.5 w-3.5 object-contain relative z-20"
            />
            <span
              className={cn(
                "font-mono text-[11px] font-medium tracking-[0.16em] uppercase relative z-20",
                !isPython ? "font-semibold text-white" : "text-zinc-400"
              )}
            >
              Java
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
