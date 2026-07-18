import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import CourseArchive from "@/components/platform/CourseArchive";
import { courseDetails, getCourse } from "@/lib/vault-data";
import { resourcesForCourse } from "@/lib/resources";

export function generateStaticParams() {
  return courseDetails.map((c) => ({ code: c.code.replace(/\s+/g, "-") }));
}

export function generateMetadata({
  params,
}: {
  params: { code: string };
}): Metadata {
  const course = getCourse(decodeURIComponent(params.code));
  if (!course) return { title: "Course · BRACU Vault" };
  return {
    title: `${course.code} ${course.title} Notes & Past Questions · BRACU Vault`,
    description: `Free ${course.code} (${course.title}) resources for BRAC University students: lecture notes, slides, previous questions (quiz, mid, final), assignment and lab solutions, and projects.`,
  };
}

export default function CoursePage({ params }: { params: { code: string } }) {
  const raw = decodeURIComponent(params.code);
  const meta = getCourse(raw);
  const files = resourcesForCourse(raw);

  if (!meta && files.length === 0) notFound();

  const code = meta?.code ?? raw.replace(/-/g, " ");
  const title = meta?.title ?? code;
  const category = meta?.category ?? files[0]?.category ?? "core";

  // Structured data for this course's resource collection.
  const courseLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${code} ${title}: notes, slides and past questions`,
    url: `https://bracuvault.me/course/${code.replace(/\s+/g, "-")}`,
    description: `Study resources for ${code} ${title} at BRAC University: lecture notes, slides, previous questions, lab solutions and projects.`,
    isPartOf: { "@type": "WebSite", name: "BRACU Vault", url: "https://bracuvault.me" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseLd) }}
      />
      <Navbar />
      <CourseArchive code={code} title={title} category={category} files={files} />
    </>
  );
}
