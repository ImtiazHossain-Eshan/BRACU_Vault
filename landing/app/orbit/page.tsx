import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import OrbitCurriculum from "@/components/orbit/OrbitCurriculum";

export const metadata: Metadata = {
  title: "Orbit · BRACU Vault",
  description:
    "Navigate the BRAC University CSE curriculum as a 3D orbital knowledge system: categories as rings, courses as nodes.",
};

export default function OrbitPage() {
  return (
    <>
      <Navbar />
      <OrbitCurriculum />
    </>
  );
}
