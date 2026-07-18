import type { Metadata } from "next";
import BrandShowcase from "@/components/brand/BrandShowcase";

export const metadata: Metadata = {
  title: "Brand · BRACU Vault",
  description:
    "The BRACU Vault identity system: the vault monogram, logotype, lockups, colour system, favicon and motion concept.",
  robots: { index: false, follow: true },
};

export default function BrandPage() {
  return <BrandShowcase />;
}
