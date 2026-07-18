"use client";

import { useEffect, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

const cache = new Map<string, string[][]>();

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&amp;/g, "&");
}

function Spinner() {
  return (
    <div className="grid h-full w-full place-items-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-fg/20 border-t-accent" />
    </div>
  );
}

export default function PptxViewer({ url }: { url: string }) {
  const [slides, setSlides] = useState<string[][] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        let data = cache.get(url);
        if (!data) {
          const JSZip = (await import("jszip")).default;
          const buf = await (await fetch(url)).arrayBuffer();
          const zip = await JSZip.loadAsync(buf);
          const names = Object.keys(zip.files)
            .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
            .sort(
              (a, b) =>
                Number(a.match(/(\d+)/)?.[1] ?? 0) - Number(b.match(/(\d+)/)?.[1] ?? 0)
            );
          const out: string[][] = [];
          for (const n of names) {
            const xml = await zip.files[n].async("string");
            const paras = [...xml.matchAll(/<a:p>([\s\S]*?)<\/a:p>/g)]
              .map((p) =>
                [...p[1].matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)]
                  .map((m) => decodeXml(m[1]))
                  .join("")
                  .trim()
              )
              .filter(Boolean);
            out.push(paras);
          }
          data = out;
          cache.set(url, data);
        }
        if (!cancelled) {
          setSlides(data);
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

  if (error || !slides)
    return (
      <div className="grid h-full w-full place-items-center px-6 text-center text-sm text-fg/50">
        <p>
          Couldn’t read this presentation.{" "}
          <a className="text-accent underline" href={url} target="_blank" rel="noreferrer">
            Open it directly →
          </a>
        </p>
      </div>
    );

  return (
    <div className="h-full overflow-auto p-4 sm:p-6">
      <p className="mb-4 text-xs text-fg/40">
        {slides.length} slide{slides.length === 1 ? "" : "s"} · text outline
      </p>
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {slides.map((para, i) => (
          <div key={i} className="relative overflow-hidden rounded-2xl glass p-5 sm:p-6">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-fg/40">
              Slide {i + 1}
            </span>
            {para.length === 0 ? (
              <p className="text-sm italic text-fg/35">No text on this slide</p>
            ) : (
              <>
                <h3 className="font-display text-lg font-semibold leading-snug text-fg">
                  {para[0]}
                </h3>
                {para.length > 1 && (
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg/70">
                    {para.slice(1).map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
