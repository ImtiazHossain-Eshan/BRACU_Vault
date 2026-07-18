"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useVaultStore } from "@/store/useVaultStore";

// command palette is client-only and lazy — never blocks first paint
const CommandSearch = dynamic(() => import("./CommandSearch"), { ssr: false });

/** Mounted once in the root layout: hydrates the persisted store after mount
 *  and provides the global ⌘K search across every page. */
export default function PlatformChrome() {
  useEffect(() => {
    void useVaultStore.persist.rehydrate();
  }, []);

  return <CommandSearch />;
}
