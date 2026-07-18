"use client";

import { useEffect, useState } from "react";

/**
 * Detects whether to render the 3D orbit. Returns null while detecting, then
 * true if WebGL is available and the user hasn't requested reduced motion,
 * false otherwise (→ 2D fallback).
 */
export function useWebGL(): boolean | null {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") || canvas.getContext("webgl");
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      setOk(!!gl && !reduced);
    } catch {
      setOk(false);
    }
  }, []);

  return ok;
}
