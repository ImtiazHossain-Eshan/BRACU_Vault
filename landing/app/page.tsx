import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import Curriculum from "@/components/Curriculum";
import FeaturedProjects from "@/components/FeaturedProjects";
import ExperienceFlow from "@/components/ExperienceFlow";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="relative">
        <Hero />
        <Stats />
        <Curriculum />
        <FeaturedProjects />
        <ExperienceFlow />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
