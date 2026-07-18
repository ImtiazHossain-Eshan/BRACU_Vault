"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Dark / light switch. Reads the initial state from the <html> class set by
 * the no-FOUC script, persists the choice, and dispatches a `themechange`
 * event so the canvas network can recolor itself live.
 */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    const el = document.documentElement;
    el.classList.toggle("dark", next);
    try {
      localStorage.setItem("bracu-theme", next ? "dark" : "light");
    } catch {}
    window.dispatchEvent(new CustomEvent("themechange"));
  }

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
      aria-pressed={dark}
      title={dark ? "Light · Paper" : "Dark · Ink"}
      className="glass relative grid h-9 w-16 grid-cols-2 place-items-center rounded-full px-1 transition-shadow hover:shadow-glow"
    >
      {/* sliding knob */}
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 34 }}
        className="absolute top-1 h-7 w-7 rounded-full bg-gradient-to-br from-highlight via-accent to-accent-2 shadow-soft"
        style={{ left: mounted && dark ? "calc(100% - 1.75rem - 0.25rem)" : "0.25rem" }}
      />
      {/* sun */}
      <svg
        viewBox="0 0 24 24"
        className={`relative z-10 h-4 w-4 transition-colors ${
          dark ? "text-fg/40" : "text-bg"
        }`}
        fill="none"
      >
        <circle cx="12" cy="12" r="4" fill="currentColor" />
        <path
          d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {/* moon */}
      <svg
        viewBox="0 0 24 24"
        className={`relative z-10 h-4 w-4 transition-colors ${
          dark ? "text-bg" : "text-fg/40"
        }`}
        fill="none"
      >
        <path
          d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8Z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
}
