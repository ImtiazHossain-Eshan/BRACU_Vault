"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * "Add to Home Screen" affordance. Captures Chrome/Android's
 * `beforeinstallprompt`; on iOS Safari (which has no such event) it shows the
 * Share → Add to Home Screen hint. Dismissal is remembered. Hidden once the app
 * is already running standalone.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BIPEvent = any;

const DISMISS_KEY = "bracu-pwa-dismissed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    const onBIP = (e: BIPEvent) => {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    // iOS: no beforeinstallprompt - detect iOS Safari and show the manual hint
    const ua = window.navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /^((?!chrome|crios|android).)*safari/i.test(ua);
    if (isIOS && isSafari) {
      setIosHint(true);
      const t = setTimeout(() => setShow(true), 2500);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBIP);
      };
    }
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  }

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {}
    setDeferred(null);
    dismiss();
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-[70] mx-auto max-w-md overflow-hidden rounded-2xl glass-strong p-4 shadow-glow sm:inset-x-auto sm:bottom-5 sm:right-5 sm:left-auto sm:w-[22rem]"
        >
          <div className="flex items-start gap-3">
            <span
              className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl"
              style={{ background: "linear-gradient(135deg, #C17A2B, #8B6F47 55%, #3A2E22)" }}
            >
              <svg width="22" height="22" viewBox="0 0 48 48" fill="none" stroke="#F8F5F0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M24 9 L37 16.5 L37 31.5 L24 39 L11 31.5 L11 16.5 Z" />
                <path d="M16 20 L24 29 L32 20" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-fg">Install BRACU Vault</p>
              {iosHint ? (
                <p className="mt-0.5 text-xs leading-relaxed text-fg/55">
                  Tap <span className="font-semibold text-fg/80">Share</span> then{" "}
                  <span className="font-semibold text-fg/80">Add to Home Screen</span>.
                </p>
              ) : (
                <p className="mt-0.5 text-xs leading-relaxed text-fg/55">
                  Add it to your home screen for full-screen, offline access.
                </p>
              )}
            </div>
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-fg/40 transition-colors hover:bg-fg/5 hover:text-fg"
            >
              ✕
            </button>
          </div>

          {!iosHint && (
            <button
              onClick={install}
              className="mt-3 w-full rounded-full bg-fg px-4 py-2.5 text-sm font-semibold text-bg transition-transform hover:scale-[1.02]"
            >
              Install app
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
