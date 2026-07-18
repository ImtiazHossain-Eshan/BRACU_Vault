"use client";

import { useEffect, useRef } from "react";

/**
 * Lightweight "knowledge network" — a 2D-canvas constellation of nodes
 * linked by proximity, gently drifting and reacting to the cursor.
 * Colors are pulled from CSS variables, so it reads as neon ink in the dark
 * theme and brown manuscript ink in the light "Paper" theme — and recolors
 * live when the theme is toggled. Density scales with viewport area;
 * honors prefers-reduced-motion; pauses when scrolled out of view.
 */
export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    let raf = 0;
    let running = true;

    const mouse = { x: -9999, y: -9999 };

    interface P {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      hue: number;
    }
    let particles: P[] = [];

    let palette = ["#34e7e4", "#5b8cff", "#9b7bff", "#ff6fae"];
    let linkRGB = "120,160,255";

    function readTheme() {
      const cs = getComputedStyle(document.documentElement);
      const next = [
        cs.getPropertyValue("--net-1").trim(),
        cs.getPropertyValue("--net-2").trim(),
        cs.getPropertyValue("--net-3").trim(),
        cs.getPropertyValue("--net-4").trim(),
      ].filter(Boolean);
      if (next.length === 4) palette = next;
      const link = cs.getPropertyValue("--net-link").trim();
      if (link) linkRGB = link;
    }

    function seed() {
      const count = Math.max(
        24,
        Math.min(96, Math.floor((width * height) / 16500))
      );
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.6 + 0.7,
        hue: Math.floor(Math.random() * 4),
      }));
    }

    function resize() {
      width = canvas!.clientWidth;
      height = canvas!.clientHeight;
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    const LINK = 132;

    function frame() {
      ctx!.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK) {
            const alpha = (1 - dist / LINK) * 0.5;
            ctx!.strokeStyle = `rgba(${linkRGB},${alpha})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }

      for (const p of particles) {
        const mdx = mouse.x - p.x;
        const mdy = mouse.y - p.y;
        const mdist = Math.hypot(mdx, mdy);
        if (mdist < 150) {
          const pull = (1 - mdist / 150) * 0.04;
          p.vx += mdx * pull * 0.02;
          p.vy += mdy * pull * 0.02;
        }

        if (!reduce) {
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.99;
          p.vy *= 0.99;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
        }

        const color = palette[p.hue] ?? palette[0];
        ctx!.beginPath();
        ctx!.fillStyle = color;
        ctx!.shadowBlur = 8;
        ctx!.shadowColor = color;
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.shadowBlur = 0;
      }

      if (running && !reduce) raf = requestAnimationFrame(frame);
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }
    function onMouseLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting;
        if (running && !reduce) {
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(frame);
        }
      },
      { threshold: 0 }
    );

    // recolor when the theme toggles
    const onThemeChange = () => {
      readTheme();
      if (reduce) frame();
    };
    const mo = new MutationObserver(onThemeChange);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    window.addEventListener("themechange", onThemeChange);

    readTheme();
    resize();
    frame();
    io.observe(canvas);
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseout", onMouseLeave);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("themechange", onThemeChange);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseout", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 h-full w-full"
      style={{ opacity: "var(--net-opacity)" }}
    />
  );
}
