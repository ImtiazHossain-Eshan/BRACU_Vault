"use client";

import { useEffect, useState } from "react";
import { langOf } from "@/lib/preview-utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

// caches across opens (same session)
const textCache = new Map<string, string>();
let hlPromise: Promise<any> | null = null;

async function getHighlighter() {
  if (!hlPromise) {
    hlPromise = (async () => {
      const { createHighlighter } = await import("shiki");
      return createHighlighter({
        themes: ["github-dark", "github-light"],
        langs: [
          "python", "cpp", "c", "javascript", "typescript", "jsx", "tsx",
          "java", "json", "sql", "html", "css", "bash", "markdown",
        ],
      });
    })();
  }
  return hlPromise;
}

function ipynbToText(src: string): string {
  try {
    const nb = JSON.parse(src);
    if (!Array.isArray(nb.cells)) return src;
    return nb.cells
      .map((c: any) => {
        const s = Array.isArray(c.source) ? c.source.join("") : c.source || "";
        if (c.cell_type === "markdown")
          return s.split("\n").map((l: string) => "# " + l).join("\n");
        return s;
      })
      .join("\n\n# %% ─────────────────────────────\n\n");
  } catch {
    return src;
  }
}

function Spinner() {
  return (
    <div className="grid h-full w-full place-items-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-fg/20 border-t-accent" />
    </div>
  );
}

export default function CodeViewer({
  url,
  ext,
  plain = false,
}: {
  url: string;
  ext: string;
  plain?: boolean;
}) {
  const [raw, setRaw] = useState("");
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        let text = textCache.get(url);
        if (text === undefined) {
          const r = await fetch(url);
          text = await r.text();
          textCache.set(url, text);
        }
        if (ext === "ipynb") text = ipynbToText(text);
        const capped =
          text.length > 180000
            ? text.slice(0, 180000) + "\n\n… (truncated for preview)"
            : text;
        if (cancelled) return;
        setRaw(capped);
        setLoading(false);

        if (plain) {
          setHtml(null);
          return;
        }
        const dark = document.documentElement.classList.contains("dark");
        const lang = ext === "ipynb" ? "python" : langOf(ext);
        const hl = await getHighlighter();
        const useLang = hl.getLoadedLanguages().includes(lang) ? lang : "markdown";
        const out = hl.codeToHtml(capped, {
          lang: useLang,
          theme: dark ? "github-dark" : "github-light",
        });
        if (!cancelled) setHtml(out);
      } catch {
        if (!cancelled) {
          setLoading(false);
          setHtml(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, ext, plain]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="relative h-full">
      <button
        onClick={copy}
        className="absolute right-4 top-3 z-10 rounded-full glass px-3 py-1.5 text-xs font-medium text-fg/70 shadow-soft transition-colors hover:text-fg"
      >
        {copied ? "Copied ✓" : "Copy"}
      </button>
      <div className="h-full overflow-auto p-4 text-[13px] leading-relaxed sm:p-5">
        {loading ? (
          <Spinner />
        ) : html ? (
          <div className="code-shiki" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <pre className="whitespace-pre-wrap break-words font-mono text-fg/80">{raw}</pre>
        )}
      </div>
    </div>
  );
}
