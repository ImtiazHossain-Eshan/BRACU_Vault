"use client";

import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import ThemeToggle from "./ui/ThemeToggle";
import Logo from "./brand/Logo";
import { useVerification } from "@/lib/use-verification";

const links = [
  { label: "Orbit", href: "/orbit" },
  { label: "Dashboard", href: "/dashboard" },
];

function openSearch() {
  window.dispatchEvent(new CustomEvent("bracu:search-open"));
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  // Upload lives in the chrome only while exploring the vault - not on the
  // marketing landing page (keeps it out of the way while reading).
  const pathname = usePathname();
  const showUpload = ["/orbit", "/course", "/dashboard"].some((p) => pathname?.startsWith(p) ?? false);

  // Show an Admin link only to staff (roles resolved from the API when signed in).
  const { status } = useVerification();
  const isAdmin = !!status?.roles?.some((r) => ["moderator", "admin", "super_admin"].includes(r));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header id="top" className="fixed inset-x-0 top-0 z-50">
      {/* scroll progress */}
      <motion.div
        style={{ scaleX: progress }}
        className="absolute left-0 top-0 h-0.5 w-full origin-left bg-gradient-to-r from-highlight via-accent to-accent-2"
      />

      <nav
        className={cn(
          "mx-auto flex max-w-content items-center justify-between px-5 py-3.5 transition-all duration-500 sm:px-8",
          scrolled ? "mt-2 sm:mt-3" : "mt-0"
        )}
      >
        <div
          className={cn(
            "flex w-full items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-500 sm:px-5",
            scrolled ? "glass-strong shadow-glow" : "bg-transparent"
          )}
        >
          <Logo href="/" animated className="flex-shrink-0" wordClassName="whitespace-nowrap" />

          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-full px-4 py-2 text-sm text-fg/65 transition-colors hover:bg-fg/5 hover:text-fg"
              >
                {l.label}
              </a>
            ))}
            {isAdmin && (
              <a
                href="/admin"
                className="rounded-full px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
              >
                Admin
              </a>
            )}
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              onClick={openSearch}
              aria-label="Search the vault"
              className="hidden items-center gap-2 rounded-full glass px-3 py-2 text-sm text-fg/60 transition-colors hover:text-fg sm:inline-flex"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="hidden lg:inline">Search</span>
              <kbd className="rounded border border-fg/15 px-1 text-[10px] text-fg/40">⌘K</kbd>
            </button>

            <ThemeToggle />

            {!showUpload && (
              <a
                href="/orbit"
                className="hidden whitespace-nowrap rounded-full bg-fg px-5 py-2.5 text-sm font-semibold text-bg transition-transform hover:scale-[1.03] md:inline-flex"
              >
                Enter Vault
              </a>
            )}

            {/* mobile toggle */}
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={open}
              className="grid h-9 w-9 place-items-center rounded-xl glass md:hidden"
            >
              <div className="space-y-1.5">
                <motion.span
                  animate={open ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                  className="block h-0.5 w-5 bg-fg"
                />
                <motion.span
                  animate={open ? { opacity: 0 } : { opacity: 1 }}
                  className="block h-0.5 w-5 bg-fg"
                />
                <motion.span
                  animate={open ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                  className="block h-0.5 w-5 bg-fg"
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="mx-5 mt-2 overflow-hidden rounded-2xl glass-strong p-2 md:hidden"
          >
            <button
              onClick={() => {
                setOpen(false);
                openSearch();
              }}
              className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-base text-fg/75 transition-colors hover:bg-fg/5 hover:text-fg"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Search
            </button>
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-3 text-base text-fg/75 transition-colors hover:bg-fg/5 hover:text-fg"
              >
                {l.label}
              </a>
            ))}
            {isAdmin && (
              <a
                href="/admin"
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-3 text-base font-medium text-accent transition-colors hover:bg-accent/10"
              >
                Admin
              </a>
            )}
            <a
              href="/orbit"
              onClick={() => setOpen(false)}
              className="mt-1 block rounded-xl bg-fg px-4 py-3 text-center text-base font-semibold text-bg"
            >
              Enter Vault
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
