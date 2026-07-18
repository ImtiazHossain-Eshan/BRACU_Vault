import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Dashboard from "@/components/platform/Dashboard";

export const metadata: Metadata = {
  title: "Dashboard · BRACU Vault",
  description:
    "Your recently viewed courses, saved files and personalized recommendations.",
  robots: { index: false, follow: true },
};

export default function DashboardPage() {
  return (
    <>
      <Navbar />
      <Dashboard />
    </>
  );
}
