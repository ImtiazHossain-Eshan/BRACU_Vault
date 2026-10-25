"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

function openSearch() {
  window.dispatchEvent(new CustomEvent("bracu:search-open"));
}

const Icon = {
  home: (
    <path d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
  ),
  orbit: (
    <>
      <circle cx="12" cy="12" r="3" />
      <ellipse cx="12" cy="12" rx="9" ry="4" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
    </>
  ),
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" />
    </>
  ),
};

type Tab =
  | { label: string; icon: keyof typeof Icon; href: string }
  | { label: string; icon: keyof typeof Icon; action: "search" };

const tabs: Tab[] = [
  { label: "Home", icon: "home", href: "/" },
  { label: "Orbit", icon: "orbit", href: "/orbit" },
  { label: "Dashboard", icon: "dashboard", href: "/dashboard" },
  { label: "Search", icon: "search", action: "search" },
];

/**
 * App-style bottom navigation - mobile only (hidden ≥md). Reflects the active
 * route; "Search" opens the global ⌘K palette via the existing event.
 */
export default function MobileTabBar() {
  const path = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[60] md:hidden" aria-label="Primary">
      <div
        className="mx-3 mb-3 flex items-stretch justify-around rounded-2xl glass-strong px-1.5 py-1.5 shadow-glow"
        style={{ marginBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        {tabs.map((t) => {
          const active =
            "href" in t && (t.href === "/" ? path === "/" : path.startsWith(t.href));
          const inner = (
            <span className="relative flex flex-col items-center gap-1 px-3 py-1.5">
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-fg/[0.06]"
                />
              )}
              <svg
                viewBox="0 0 24 24"
                className={cn(
                  "relative h-[22px] w-[22px] transition-colors",
                  active ? "text-accent" : "text-fg/50"
                )}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {Icon[t.icon]}
              </svg>
              <span
                className={cn(
                  "relative text-[10px] font-medium transition-colors",
                  active ? "text-fg" : "text-fg/45"
                )}
              >
                {t.label}
              </span>
            </span>
          );

          return "href" in t ? (
            <Link key={t.label} href={t.href} className="flex-1">
              {inner}
            </Link>
          ) : (
            <button key={t.label} onClick={openSearch} className="flex-1" aria-label="Search">
              {inner}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
