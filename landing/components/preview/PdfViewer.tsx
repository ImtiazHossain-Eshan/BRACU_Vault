"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDeviceTier } from "@/hooks/useDeviceTier";

/* eslint-disable @typescript-eslint/no-explicit-any */

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function PdfPage({
  doc,
  pageNumber,
  scale,
  maxDpr,
  onVisible,
}: {
  doc: any;
  pageNumber: number;
  scale: number;
  maxDpr: number;
  onVisible: (n: number) => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderedScale = useRef(0);
  const task = useRef<any>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    doc.getPage(pageNumber).then((p: any) => {
      const vp = p.getViewport({ scale });
      if (!cancelled) setDims({ w: vp.width, h: vp.height });
    });
    return () => {
      cancelled = true;
    };
  }, [doc, pageNumber, scale]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting) return;
        onVisible(pageNumber);
        if (renderedScale.current === scale) return;
        renderedScale.current = scale;
        const page = await doc.getPage(pageNumber);
        const vp = page.getViewport({ scale });
        const cv = canvas.current;
        const ctx = cv?.getContext("2d");
        if (!cv || !ctx) return;
        // cap DPR by device tier → keeps canvas memory sane on weak phones
        const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
        cv.width = Math.floor(vp.width * dpr);
        cv.height = Math.floor(vp.height * dpr);
        cv.style.width = `${vp.width}px`;
        cv.style.height = `${vp.height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        try {
          task.current?.cancel?.();
        } catch {
          /* noop */
        }
        task.current = page.render({ canvasContext: ctx, viewport: vp });
        try {
          await task.current.promise;
        } catch {
          /* render cancelled */
        }
      },
      { root: el.closest("[data-pdf-scroll]"), rootMargin: "800px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [doc, pageNumber, scale, maxDpr, onVisible]);

  return (
    <div
      ref={wrap}
      className="mx-auto mb-4 overflow-hidden rounded-lg bg-white shadow-soft"
      style={dims ? { width: dims.w, height: dims.h } : { width: "100%", aspectRatio: "1 / 1.414" }}
    >
      <canvas ref={canvas} />
    </div>
  );
}

export default function PdfViewer({ url }: { url: string }) {
  const caps = useDeviceTier();
  const [doc, setDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(false);

  // pinch-to-zoom state
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const startDist = useRef(0);
  const startScale = useRef(1.2);
  const liveRef = useRef(1);
  const [gesturing, setGesturing] = useState(false);
  const [live, setLive] = useState(1);

  // touch devices start fit-ish; cap render DPR by tier
  const initRef = useRef(false);
  useEffect(() => {
    if (caps.ready && !initRef.current) {
      initRef.current = true;
      if (caps.isTouch) setScale(1);
    }
  }, [caps.ready, caps.isTouch]);

  useEffect(() => {
    let cancelled = false;
    let localDoc: any;
    (async () => {
      try {
        const pdfjs: any = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        localDoc = await pdfjs.getDocument(url).promise;
        if (cancelled) {
          localDoc.destroy?.();
          return;
        }
        setDoc(localDoc);
        setNumPages(localDoc.numPages);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
      try {
        localDoc?.destroy?.();
      } catch {
        /* noop */
      }
    };
  }, [url]);

  const onVisible = useCallback((n: number) => setPage(n), []);

  function dist() {
    const pts = [...pointers.current.values()];
    if (pts.length < 2) return 0;
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  }

  function onPointerDown(e: React.PointerEvent) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      startDist.current = dist();
      startScale.current = scale;
      liveRef.current = 1;
      setLive(1);
      setGesturing(true);
    }
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (gesturing && pointers.current.size === 2 && startDist.current > 0) {
      const ratio = clamp(dist() / startDist.current, 0.4, 3);
      liveRef.current = ratio;
      setLive(ratio);
    }
  }
  function endPointer(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (gesturing && pointers.current.size < 2) {
      setScale((s) => clamp(+(startScale.current * liveRef.current).toFixed(2), 0.6, 3) || s);
      setGesturing(false);
      setLive(1);
      liveRef.current = 1;
    }
  }

  if (error)
    return (
      <div className="grid h-full w-full place-items-center px-6 text-center text-sm text-fg/50">
        <p>
          Couldn’t render this PDF in-page.{" "}
          <a className="text-accent underline" href={url} target="_blank" rel="noreferrer">
            Open it directly →
          </a>
        </p>
      </div>
    );

  if (!doc)
    return (
      <div className="grid h-full w-full place-items-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-fg/20 border-t-accent" />
      </div>
    );

  return (
    <div className="flex h-full flex-col">
      <div
        data-pdf-scroll
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        className="flex-1 overflow-y-auto px-4 py-4 sm:px-8"
        style={{ touchAction: "pan-y" }} // we own pinch; allow vertical pan
      >
        <div
          style={{
            transform: gesturing && live !== 1 ? `scale(${live})` : undefined,
            transformOrigin: "top center",
            willChange: gesturing ? "transform" : undefined,
          }}
        >
          {Array.from({ length: numPages }, (_, i) => (
            <PdfPage
              key={i}
              doc={doc}
              pageNumber={i + 1}
              scale={scale}
              maxDpr={caps.pdfScale}
              onVisible={onVisible}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 border-t border-fg/10 px-4 py-2.5">
        <div className="flex items-center gap-1 rounded-full glass px-1.5 py-1">
          <button
            onClick={() => setScale((s) => Math.max(0.6, +(s - 0.2).toFixed(2)))}
            aria-label="Zoom out"
            className="grid h-6 w-6 place-items-center rounded-full text-fg/70 transition-colors hover:bg-fg/5 hover:text-fg"
          >
            −
          </button>
          <span className="w-12 text-center text-xs tabular-nums text-fg/60">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(3, +(s + 0.2).toFixed(2)))}
            aria-label="Zoom in"
            className="grid h-6 w-6 place-items-center rounded-full text-fg/70 transition-colors hover:bg-fg/5 hover:text-fg"
          >
            +
          </button>
        </div>
        <span className="text-xs text-fg/50">
          Page <span className="font-semibold text-fg">{page}</span> / {numPages}
        </span>
      </div>
    </div>
  );
}
