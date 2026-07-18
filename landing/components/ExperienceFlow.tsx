"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { flowSteps } from "@/lib/data";
import SectionHeading from "./ui/SectionHeading";
import { cn } from "@/lib/cn";

export default function ExperienceFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 65%", "end 75%"],
  });

  // the line "draws" downward, and a glowing traveler rides it
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const travelerTop = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="flow" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <SectionHeading
          eyebrow="The Flow"
          title={
            <>
              From course to{" "}
              <span className="text-gradient">capstone</span>, in four moves
            </>
          }
          subtitle="A single, guided path through the vault: pick, open, practice, build."
        />

        <div ref={ref} className="relative mx-auto mt-20 max-w-4xl">
          {/* spine */}
          <div className="absolute left-5 top-0 h-full w-px -translate-x-1/2 bg-fg/[0.08] md:left-1/2">
            <motion.div
              style={{ scaleY: lineScale }}
              className="absolute inset-0 origin-top bg-gradient-to-b from-highlight via-accent to-accent-2"
            />
            {/* glowing traveler */}
            <motion.div
              style={{
                top: travelerTop,
                background: "rgb(var(--fg))",
                boxShadow: "var(--traveler-glow)",
              }}
              className="absolute left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full"
            />
          </div>

          <div className="flex flex-col gap-14">
            {flowSteps.map((s, i) => {
              const left = i % 2 === 0;
              return (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6 }}
                  className={cn(
                    "relative flex w-full",
                    "pl-14 md:pl-0",
                    left ? "md:justify-start" : "md:justify-end"
                  )}
                >
                  {/* node dot */}
                  <span className="absolute left-5 top-2 z-10 grid h-3 w-3 -translate-x-1/2 place-items-center rounded-full bg-accent-2 shadow-glow-cyan md:left-1/2" />

                  <div
                    className={cn(
                      "w-full rounded-[1.75rem] glass p-6 transition-shadow hover:shadow-glow sm:p-7 md:w-[44%]"
                    )}
                  >
                    <span className="font-display text-5xl font-semibold tracking-tightest text-fg/[0.12]">
                      {s.step}
                    </span>
                    <h3 className="mt-2 font-display text-xl font-semibold text-fg">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-fg/55">
                      {s.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
