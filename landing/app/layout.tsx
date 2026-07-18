import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import Atmosphere from "@/components/Atmosphere";
import PlatformChrome from "@/components/platform/PlatformChrome";
import PreviewProvider from "@/components/preview/PreviewProvider";
import RegisterServiceWorker from "@/components/pwa/RegisterServiceWorker";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import MobileTabBar from "@/components/MobileTabBar";
import Providers from "@/components/Providers";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const siteUrl = "https://bracuvault.me";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "BRACU Vault: BRAC University CSE Notes, Past Questions & Labs",
  description:
    "13,000+ curated files across 39 courses. Notes, slides, labs, past exams and projects for BRAC University Computer Science, organized the way your degree actually flows.",
  // Per-page canonical URLs (resolved against metadataBase) — keeps Google from
  // splitting rank across www.bracuvault.me and *.pages.dev duplicates.
  alternates: { canonical: "./" },
  keywords: [
    "BRACU",
    "BRAC University",
    "CSE",
    "Computer Science",
    "study notes",
    "past questions",
    "previous questions",
    "question bank",
    "lab solutions",
    "BRACU CSE notes",
    "academic archive",
  ],
  authors: [{ name: "BRACU Vault" }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "BRACU Vault",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "BRACU Vault: The knowledge archive for BRAC University CSE",
    description:
      "13,000+ curated files across 39 courses. Notes, slides, labs, past exams and projects, beautifully organized.",
    siteName: "BRACU Vault",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: "BRACU Vault" }],
  },
  twitter: {
    card: "summary",
    title: "BRACU Vault",
    description:
      "The premium academic archive for BRAC University CSE: 13,000+ files across 39 courses.",
    images: ["/icons/icon-512.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F5F0" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0F10" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // draw under the notch / home indicator
};

// Runs before paint: applies the saved theme so there is no flash.
// Default is the light "Paper Intelligence" theme (no `dark` class).
const themeScript = `(function(){try{var t=localStorage.getItem('bracu-theme');if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;

// Structured data: tells search engines what the site is (rich-result eligible).
const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "BRACU Vault",
  alternateName: "BRAC University CSE Vault",
  url: siteUrl,
  description:
    "Free study archive for BRAC University Computer Science: notes, slides, past questions, lab solutions and projects across 39 courses.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
      </head>
      <body className="pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-0">
        <Providers>
          <Atmosphere />
          <PreviewProvider>
            {children}
            <PlatformChrome />
          </PreviewProvider>
          <InstallPrompt />
          <MobileTabBar />
          <RegisterServiceWorker />
        </Providers>
      </body>
    </html>
  );
}
