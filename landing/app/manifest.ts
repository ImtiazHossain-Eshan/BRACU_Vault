import type { MetadataRoute } from "next";

/** Installable PWA manifest. Icons are generated from the brand mark at
 *  /icons (see app/icons/route.tsx). Served by Next at /manifest.webmanifest. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "BRACU Vault: CSE Knowledge Archive",
    short_name: "BRACU Vault",
    description:
      "Notes, slides, labs, past exams and projects for BRAC University CSE, organised the way your degree flows.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0F0F10",
    theme_color: "#C17A2B",
    categories: ["education", "productivity", "books"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Orbit · 3D courses",
        short_name: "Orbit",
        url: "/orbit?source=pwa",
        description: "Navigate every course in space",
      },
      {
        name: "Dashboard",
        short_name: "Dashboard",
        url: "/dashboard?source=pwa",
        description: "Recents, saved files and picks",
      },
    ],
  };
}
