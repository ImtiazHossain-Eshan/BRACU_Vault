import type { CategoryId } from "./data";

export type { CategoryId };

export type ResourceType =
  | "Notes"
  | "Slides"
  | "Assignments"
  | "Questions"
  | "Solutions"
  | "Projects";

export type Semester = "Spring" | "Summer" | "Fall";

export type FileFormat = "pdf" | "pptx" | "docx" | "ipynb" | "zip" | "code";

export interface VaultFile {
  id: string;
  title: string;
  course: string; // course code, e.g. "CSE 221"
  courseTitle: string;
  category: CategoryId;
  type: ResourceType;
  semester: Semester;
  year: number;
  format: FileFormat;
  tags: string[];
  size: string;
  popularity: number; // 0–100, drives sort + recommendations
}

export interface CourseSummary {
  code: string;
  title: string;
  category: CategoryId;
  fileCount: number;
  counts: Record<ResourceType, number>;
}

export interface CourseDetail extends CourseSummary {
  files: VaultFile[];
}

export const RESOURCE_TYPES: ResourceType[] = [
  "Notes",
  "Slides",
  "Assignments",
  "Questions",
  "Solutions",
  "Projects",
];

export const SEMESTERS: Semester[] = ["Spring", "Summer", "Fall"];
