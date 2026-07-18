"use client";

import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { fileUrl, humanSize, kindOf } from "@/lib/preview-utils";

export interface PreviewFile {
  p: string;
  name: string;
  ext: string;
  size?: number;
  course?: string;
  section?: string;
}

function Spinner() {
  return (
    <div className="grid h-full w-full place-items-center">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-fg/20 border-t-accent" />
    </div>
  );
}

const PdfViewer = dynamic(() => import("./PdfViewer"), { ssr: false, loading: () => <Spinner /> });
const CodeViewer = dynamic(() => import("./CodeViewer"), { ssr: false, loading: () => <Spinner /> });
const OfficeViewer = dynamic(() => import("./OfficeViewer"), { ssr: false, loading: () => <Spinner /> });

function Fallback({ file }: { file: PreviewFile }) {
  return (
    <div className="grid h-full w-full place-items-center p-8 text-center">
      <div>
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-fg/[0.05] text-xs font-bold uppercase text-fg/60">
          {file.ext}
        </div>
        <p className="mt-5 text-sm text-fg/60">
          Inline preview isn’t available for <span className="font-semibold text-fg">.{file.ext}</span> files.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <a
            href={fileUrl(file.p)}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-fg px-4 py-2 text-sm font-semibold text-bg transition-transform hover:scale-[1.03]"
          >
            Open in new tab
          </a>
          <a
            href={fileUrl(file.p, true)}
            className="rounded-full glass px-4 py-2 text-sm text-fg/80 transition-colors hover:text-fg"
          >
            Download
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PreviewModal({
  file,
  onClose,
}: {
  file: PreviewFile | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!file) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [file, onClose]);

  const kind = file ? kindOf(file.ext) : "unsupported";
  const url = file ? fileUrl(file.p) : "";

  return (
    <AnimatePresence>
      {file && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-bg/75 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.28, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl glass-strong shadow-glow"
          >
            {/* header */}
            <header className="flex items-center justify-between gap-3 border-b border-fg/10 px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-accent/15 text-[10px] font-bold uppercase text-accent">
                  {file.ext}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-fg">{file.name}</div>
                  <div className="truncate text-xs text-fg/45">
                    {[file.course, file.section, file.size ? humanSize(file.size) : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1.5">
                <a
                  href={fileUrl(file.p)}
                  target="_blank"
                  rel="noreferrer"
                  title="Open in new tab"
                  className="grid h-9 w-9 place-items-center rounded-full text-fg/50 transition-colors hover:bg-fg/5 hover:text-fg"
                >
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
                    <path d="M14 5h5v5m0-5L10 14M19 14v5H5V5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                <a
                  href={fileUrl(file.p, true)}
                  title="Download"
                  className="grid h-9 w-9 place-items-center rounded-full text-fg/50 transition-colors hover:bg-fg/5 hover:text-fg"
                >
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
                    <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                <button
                  onClick={onClose}
                  title="Close (Esc)"
                  className="grid h-9 w-9 place-items-center rounded-full text-fg/50 transition-colors hover:bg-fg/5 hover:text-fg"
                >
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
                    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </header>

            {/* body */}
            <div className="relative flex-1 overflow-hidden bg-fg/[0.02]">
              {kind === "pdf" && <PdfViewer url={url} />}
              {kind === "code" && <CodeViewer url={url} ext={file.ext} />}
              {kind === "notebook" && <CodeViewer url={url} ext="ipynb" />}
              {kind === "text" && <CodeViewer url={url} ext={file.ext} plain />}
              {kind === "image" && (
                <div className="grid h-full w-full place-items-center overflow-auto p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={file.name} className="max-h-full max-w-full rounded-lg object-contain" />
                </div>
              )}
              {kind === "office" && <OfficeViewer p={file.p} ext={file.ext} />}
              {kind === "unsupported" && <Fallback file={file} />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
