import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Admin · BRACU Vault",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <>
      <Navbar />
      <main className="relative mx-auto max-w-content px-4 pb-24 pt-28 sm:px-6">
        <AdminDashboard />
      </main>
    </>
  );
}
