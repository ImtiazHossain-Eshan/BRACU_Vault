"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (production only — a SW in dev fights HMR).
 * To test locally: `npm run build && npm start`, then open localhost.
 */
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const register = () =>
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);
  return null;
}
