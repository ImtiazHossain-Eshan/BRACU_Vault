import type { MetadataRoute } from "next";
import { courseDetails, courseHref } from "@/lib/vault-data";

// Statically generated at build time (output: "export").
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://bracuvault.me";
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/orbit`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...courseDetails.map((c) => ({
      url: `${base}${courseHref(c.code)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
