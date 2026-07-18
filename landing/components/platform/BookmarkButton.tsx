"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useVaultStore } from "@/store/useVaultStore";
import { useMounted } from "@/hooks/useMounted";
import { cn } from "@/lib/cn";

/** Save toggle with a morph + pulse-ring microinteraction. */
export default function BookmarkButton({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  const mounted = useMounted();
  const bookmarked = useVaultStore((s) => s.bookmarks.includes(id));
  const toggle = useVaultStore((s) => s.toggleBookmark);
  const active = mounted && bookmarked;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      aria-pressed={active}
      aria-label={active ? "Remove bookmark" : "Save to bookmarks"}
      className={cn(
        "relative grid h-9 w-9 flex-shrink-0 place-items-center rounded-full transition-colors",
        active ? "text-accent" : "text-fg/40 hover:bg-fg/5 hover:text-fg",
        className
      )}
    >
      <AnimatePresence>
        {active && (
          <motion.span
            key="ring"
            initial={{ scale: 0.5, opacity: 0.55 }}
            animate={{ scale: 1.9, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 rounded-full border border-accent"
          />
        )}
      </AnimatePresence>
      <motion.svg
        viewBox="0 0 24 24"
        className="h-[18px] w-[18px]"
        animate={{ scale: active ? [1, 1.28, 1] : 1 }}
        transition={{ duration: 0.32 }}
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1Z" />
      </motion.svg>
    </button>
  );
}
