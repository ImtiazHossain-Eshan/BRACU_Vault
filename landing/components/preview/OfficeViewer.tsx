"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { fileUrl, officePdfUrl } from "@/lib/preview-utils";

/* Office files (pptx/ppt/docx/doc) preview best as a pre-converted PDF rendered
 * by pdf.js — full layout + images. If the PDF hasn't been generated yet we fall
 * back to the lightweight in-browser viewers (text outline) so nothing breaks. */

function Spinner() {
  return (
    <div className="grid h-full w-full place-items-center">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-fg/20 border-t-accent" />
    </div>
  );
}

const PdfViewer = dynamic(() => import("./PdfViewer"), { ssr: false, loading: () => <Spinner /> });
const DocxViewer = dynamic(() => import("./DocxViewer"), { ssr: false, loading: () => <Spinner /> });
const DocViewer = dynamic(() => import("./DocViewer"), { ssr: false, loading: () => <Spinner /> });
const PptxViewer = dynamic(() => import("./PptxViewer"), { ssr: false, loading: () => <Spinner /> });

export default function OfficeViewer({ p, ext }: { p: string; ext: string }) {
  const pdf = officePdfUrl(p);
  // Student uploads (community/) have no pre-converted PDF, and the in-browser
  // text viewers strip images — offer the download instead of a broken preview.
  const isCommunity = p.startsWith("community/");
  const [mode, setMode] = useState<"checking" | "pdf" | "legacy">(isCommunity ? "legacy" : "checking");

  useEffect(() => {
    if (isCommunity) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(pdf, { method: "HEAD" });
        if (!cancelled) setMode(res.ok ? "pdf" : "legacy");
      } catch {
        if (!cancelled) setMode("legacy");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pdf, isCommunity]);

  if (mode === "checking") return <Spinner />;
  if (mode === "pdf") return <PdfViewer url={pdf} />;

  if (isCommunity) {
    return (
      <div className="grid h-full w-full place-items-center p-8 text-center text-sm text-fg/55">
        <div>
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-fg/[0.05] text-xs font-bold uppercase text-fg/60">
            {ext}
          </div>
          <p className="mt-5 max-w-sm">
            In-page preview isn&apos;t available yet for student-uploaded office files.
            Download it to view with full formatting and images.
          </p>
          <a
            href={fileUrl(p)}
            className="mt-5 inline-block rounded-full bg-fg px-5 py-2.5 text-sm font-semibold text-bg transition-transform hover:scale-[1.03]"
          >
            Download file
          </a>
        </div>
      </div>
    );
  }

  const e = ext.toLowerCase();
  const url = fileUrl(p);
  if (e === "docx") return <DocxViewer url={url} />;
  if (e === "doc") return <DocViewer url={url} />;
  if (e === "pptx") return <PptxViewer url={url} />;

  return (
    <div className="grid h-full w-full place-items-center p-8 text-center text-sm text-fg/55">
      <div>
        <p>A rich preview for <span className="font-semibold text-fg">.{e}</span> isn&apos;t ready yet.</p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block rounded-full bg-fg px-4 py-2 text-sm font-semibold text-bg transition-transform hover:scale-[1.03]"
        >
          Open in new tab →
        </a>
      </div>
    </div>
  );
}
