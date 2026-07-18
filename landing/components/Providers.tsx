"use client";

import { ClerkProvider } from "@clerk/clerk-react";
import type { ReactNode } from "react";

/** Client-side Clerk provider. Only the publishable key is needed here — the
 *  Worker API verifies session tokens with the secret key. If the key isn't
 *  configured, render children unwrapped so the rest of the site still works. */
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

export default function Providers({ children }: { children: ReactNode }) {
  if (!publishableKey) return <>{children}</>;
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{ variables: { colorPrimary: "#a07a4a", borderRadius: "0.75rem" } }}
    >
      {children}
    </ClerkProvider>
  );
}
