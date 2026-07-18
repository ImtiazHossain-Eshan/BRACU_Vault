import type { MetadataRoute } from "next";

// Statically generated at build time (output: "export").
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin"] },
    sitemap: "https://bracuvault.me/sitemap.xml",
  };
}
