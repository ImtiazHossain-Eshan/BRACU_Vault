import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import UploadPanel from "@/components/upload/UploadPanel";

export const metadata: Metadata = {
  title: "Verify · BRACU Vault",
  description: "Verify your BRAC University student status to unlock uploads.",
  robots: { index: false, follow: false },
};

export default function VerifyPage() {
  return (
    <>
      <Navbar />
      <main className="relative mx-auto flex min-h-[100svh] max-w-content flex-col items-center justify-center px-4 pb-20 pt-28">
        <div className="w-full max-w-md">
          <UploadPanel />
        </div>
      </main>
    </>
  );
}
