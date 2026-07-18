"use client";

import { useAuth } from "@clerk/clerk-react";
import { useCallback, useEffect, useState } from "react";
import { errMessage, verifyApi, type VerifyStatus } from "./verify-api";

/**
 * Resolves the signed-in user's verification state and auto-activates them.
 * Because verification is purely "has a verified @g.bracu.ac.bd email" (Clerk
 * already guarantees that), we activate on first load rather than asking for
 * any extra input.
 */
// Session cache: verified state rarely changes, and this hook mounts on every
// page (navbar), so a short TTL avoids one API round-trip per navigation.
const CACHE_KEY = "bracu:verify-status";
const CACHE_TTL_MS = 5 * 60_000;

function readCache(): VerifyStatus | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { s, t } = JSON.parse(raw) as { s: VerifyStatus; t: number };
    return Date.now() - t < CACHE_TTL_MS ? s : null;
  } catch {
    return null;
  }
}
function writeCache(s: VerifyStatus) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ s, t: Date.now() }));
  } catch {
    /* storage unavailable */
  }
}

export function useVerification() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [status, setStatus] = useState<VerifyStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      setStatus(null);
      try { sessionStorage.removeItem(CACHE_KEY); } catch { /* noop */ }
      return;
    }
    const cached = readCache();
    if (cached?.verified) {
      setStatus(cached);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      let s = await verifyApi.status(token);
      if (!s.verified) s = await verifyApi.activate(token);
      setStatus(s);
      if (s.verified) writeCache(s);
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (isLoaded && isSignedIn) void refresh();
  }, [isLoaded, isSignedIn, refresh]);

  return { isLoaded, isSignedIn, status, loading, error, getToken, refresh };
}
