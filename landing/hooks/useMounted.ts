"use client";

import { useEffect, useState } from "react";

/** false on the server + first client render, true after mount. Avoids
 *  hydration mismatches for client-only state (e.g. persisted bookmarks). */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
