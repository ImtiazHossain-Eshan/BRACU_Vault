"use client";

import { useEffect, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

// rendered HTML cached per file across opens
const cache = new Map<string, string>();

function Spinner() {
  return (
    <div className="grid h-full w-full place-items-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-fg/20 border-t-accent" />
    </div>
  );
}

export default function DocxViewer({ url }: { url: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        let h = cache.get(url);
        if (h === undefined) {
          const mod: any = await import("mammoth");
          const mammoth = mod.default ?? mod;
          const buf = await (await fetch(url)).arrayBuffer();
          const out = await mammoth.convertToHtml({ arrayBuffer: buf });
          h = out.value as string;
          cache.set(url, h);
        }
        if (!cancelled) {
          setHtml(h);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (loading) return <Spinner />;

  if (error || !html)
    return (
      <div className="grid h-full w-full place-items-center px-6 text-center text-sm text-fg/50">
        <p>
          Couldn’t render this document.{" "}
          <a className="text-accent underline" href={url} target="_blank" rel="noreferrer">
            Open it directly →
          </a>
        </p>
      </div>
    );

  return (
    <div className="h-full overflow-auto px-5 py-6 sm:px-8">
      <div
        className="docx-prose mx-auto max-w-3xl"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
