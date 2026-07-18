"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import UploadModal from "./UploadModal";

/** Inline "Upload" trigger (navbar + course browser). Opens the gated flow:
 *  sign in → verify → upload. When a `context` is passed (course/folder), the
 *  upload form is pre-filled to that destination. */
export default function UploadButton({
  className,
  context,
  label = "Upload",
}: {
  className?: string;
  context?: { course?: string; section?: string };
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Upload files to the Vault"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-highlight via-accent to-accent-2 px-4 py-2 text-sm font-semibold text-bg shadow-glow transition-transform hover:scale-[1.03]",
          className,
        )}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
          <path d="M12 16V4m0 0 5 5m-5-5L7 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 18h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {label}
      </button>
      <UploadModal open={open} onClose={() => setOpen(false)} context={context} />
    </>
  );
}
