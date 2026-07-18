"use client";

import { useEffect, useState } from "react";

export type DeviceTier = "high" | "mid" | "low";

export interface DeviceCaps {
  ready: boolean; // false until detected on the client (SSR-safe)
  tier: DeviceTier;
  isTouch: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  /** capability gates — wire these into 3D / motion-heavy components */
  enable3D: boolean; // full R3F scene
  enableAmbient: boolean; // drifting orbs / particle fields
  enableParallax: boolean; // pointer/scroll parallax
  pdfScale: number; // render scale for the PDF viewer
}

function detect(): Omit<DeviceCaps, "ready"> {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  const saveData = !!nav.connection?.saveData;
  const slowNet = /(^|-)2g$/.test(nav.connection?.effectiveType || "");
  const mem = nav.deviceMemory ?? (isTouch ? 4 : 8); // conservative default on touch
  const cores = nav.hardwareConcurrency ?? (isTouch ? 4 : 8);

  // WebGL availability (3D is impossible without it)
  let webgl = false;
  try {
    const c = document.createElement("canvas");
    webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    webgl = false;
  }

  // score the device
  let tier: DeviceTier;
  if (!webgl || reducedMotion || saveData || slowNet || mem <= 2 || cores <= 2) {
    tier = "low";
  } else if (mem >= 8 && cores >= 8 && !isTouch) {
    tier = "high";
  } else {
    tier = "mid";
  }

  return {
    tier,
    isTouch,
    reducedMotion,
    saveData,
    enable3D: tier !== "low" && webgl,
    enableAmbient: tier === "high",
    enableParallax: tier !== "low" && !reducedMotion,
    pdfScale: tier === "high" ? 2 : tier === "mid" ? 1.5 : 1,
  };
}

/**
 * Detects device capability and returns tier + feature gates. SSR-safe: starts
 * as the conservative "low" tier with `ready=false`, then upgrades after mount —
 * so the first paint is light and never renders 3D until the device is known.
 */
export function useDeviceTier(): DeviceCaps {
  const [caps, setCaps] = useState<DeviceCaps>({
    ready: false,
    tier: "low",
    isTouch: false,
    reducedMotion: false,
    saveData: false,
    enable3D: false,
    enableAmbient: false,
    enableParallax: false,
    pdfScale: 1,
  });

  useEffect(() => {
    setCaps({ ready: true, ...detect() });

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setCaps({ ready: true, ...detect() });
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return caps;
}
