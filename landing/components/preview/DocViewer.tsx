"use client";

import { useEffect, useState } from "react";

/**
 * Legacy .doc (Word 97–2003, binary OLE) has no clean browser parser, so this
 * does a best-effort text extraction: decode the stream and keep runs that look
 * like real prose. Not pixel-perfect, but readable - with Open/Download always
 * available in the modal header for the original.
 */
const cache = new Map<string, string[]>();

function extract(buf: ArrayBuffer): string[] {
  const tryDecode = (enc: string) => {
    let text = "";
    try {
      text = new TextDecoder(enc as any, { fatal: false }).decode(buf);
    } catch {
      return [] as string[];
    }
    const runs: string[] = [];
    let cur = "";
    const FIELD = /^(EMBED|HYPERLINK|PAGE|TOC|REF|SEQ|MERGEFORMAT|MACROBUTTON|FORMTEXT|INCLUDEPICTURE|SHAPE|TIME|DATE|STYLEREF|QUOTE)\b/i;
    const flush = () => {
      const t = cur.replace(/\s+/g, " ").trim();
      cur = "";
      if (
        FIELD.test(t) ||
        /MERGEFORMAT|Microsoft (Office )?Word|Microsoft Equation|Equation[\s.]?\d|Normal\.dotm?|Title|Subject|Author|Times New Roman|Calibri/i.test(
          t
        )
      )
        return;
      const letters = (t.match(/[A-Za-z]/g) || []).length;
      const nonAscii = (t.match(/[^\x20-\x7E]/g) || []).length;
      const distinct = new Set(t).size;
      if (
        t.length >= 12 &&
        letters / t.length > 0.55 && // mostly real letters (ASCII)
        nonAscii / t.length < 0.08 && // reject binary / garbage runs
        /[a-z]/.test(t) && // has lowercase → real words, not field codes
        t.includes(" ") && // real prose has spaces
        distinct / t.length > 0.2 // kills repeated-filler runs (ÿÿÿ, ....)
      )
        runs.push(t);
    };
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      const printable =
        code === 9 ||
        code === 10 ||
        code === 13 ||
        (code >= 32 && code < 127) ||
        (code >= 0xa0 && code < 0x2000);
      if (printable) cur += text[i];
      else flush();
    }
    flush();
    return runs;
  };

  // modern .doc bodies are usually UTF-16LE; fall back to latin1
  const utf16 = tryDecode("utf-16le");
  const latin = tryDecode("windows-1252");
  const utf16Len = utf16.join("").length;
  const latinLen = latin.join("").length;
  return utf16Len >= latinLen ? utf16 : latin;
}

function Spinner() {
  return (
    <div className="grid h-full w-full place-items-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-fg/20 border-t-accent" />
    </div>
  );
}

export default function DocViewer({ url }: { url: string }) {
  const [paras, setParas] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        let p = cache.get(url);
        if (!p) {
          const buf = await (await fetch(url)).arrayBuffer();
          p = extract(buf);
          cache.set(url, p);
        }
        if (!cancelled) {
          setParas(p);
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

  if (error || !paras || paras.length === 0)
    return (
      <div className="grid h-full w-full place-items-center px-6 text-center text-sm text-fg/50">
        <p>
          This legacy .doc couldn’t be read inline.{" "}
          <a className="text-accent underline" href={url} target="_blank" rel="noreferrer">
            Open it directly →
          </a>
        </p>
      </div>
    );

  return (
    <div className="h-full overflow-auto px-5 py-6 sm:px-8">
      <div className="docx-prose mx-auto max-w-3xl">
        <p className="mb-4 rounded-lg border border-fg/10 bg-fg/[0.03] px-3 py-2 text-xs text-fg/45">
          Best-effort text from a legacy .doc, formatting may be lost. Use Download
          for the original.
        </p>
        {paras.map((t, i) => (
          <p key={i}>{t}</p>
        ))}
      </div>
    </div>
  );
}
