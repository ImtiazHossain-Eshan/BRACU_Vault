/**
 * Single source of truth for the landing page content.
 * Course titles are editable — adjust freely to match your exact BRACU catalog.
 */

export type CategoryId = "core" | "electives" | "math" | "gened";

export interface Category {
  id: CategoryId;
  label: string;
  tagline: string;
  description: string;
  /** Tailwind gradient stops used for accents/glows. */
  from: string;
  to: string;
  glow: string;
}

export interface Course {
  code: string;
  title: string;
  category: CategoryId;
}

export const categories: Category[] = [
  {
    id: "core",
    label: "Core Computer Science",
    tagline: "The backbone of the degree",
    description:
      "Programming, data structures, algorithms, systems, databases, networks, AI and software engineering: the spine of CSE.",
    from: "var(--c-core-from)",
    to: "var(--c-core-to)",
    glow: "var(--c-core-glow)",
  },
  {
    id: "electives",
    label: "Electives",
    tagline: "Go deep, go specialized",
    description:
      "Image processing, NLP, machine learning and data communications: advanced tracks that shape your specialization.",
    from: "var(--c-electives-from)",
    to: "var(--c-electives-to)",
    glow: "var(--c-electives-glow)",
  },
  {
    id: "math",
    label: "Mathematics & Science",
    tagline: "The rigorous foundation",
    description:
      "Calculus, linear algebra, differential equations, physics and statistics: the language underneath the code.",
    from: "var(--c-math-from)",
    to: "var(--c-math-to)",
    glow: "var(--c-math-glow)",
  },
  {
    id: "gened",
    label: "General Education",
    tagline: "Breadth across five streams",
    description:
      "Writing, science, arts & humanities, social science and community: the well-rounded core of the curriculum.",
    from: "var(--c-gened-from)",
    to: "var(--c-gened-to)",
    glow: "var(--c-gened-glow)",
  },
];

export const courses: Course[] = [
  // Core Computer Science
  { code: "CSE110", title: "Programming Language I", category: "core" },
  { code: "CSE111", title: "Programming Language II", category: "core" },
  { code: "CSE220", title: "Data Structures", category: "core" },
  { code: "CSE221", title: "Algorithms", category: "core" },
  { code: "CSE230", title: "Discrete Mathematics", category: "core" },
  { code: "CSE260", title: "Digital Logic Design", category: "core" },
  { code: "CSE321", title: "Operating Systems", category: "core" },
  { code: "CSE330", title: "Numerical Methods", category: "core" },
  { code: "CSE331", title: "Automata & Computability", category: "core" },
  { code: "CSE340", title: "Computer Architecture", category: "core" },
  { code: "CSE370", title: "Database Systems", category: "core" },
  { code: "CSE400", title: "Project & Thesis", category: "core" },
  { code: "CSE420", title: "Compiler Design", category: "core" },
  { code: "CSE421", title: "Computer Networks", category: "core" },
  { code: "CSE422", title: "Artificial Intelligence", category: "core" },
  { code: "CSE423", title: "Computer Graphics", category: "core" },
  { code: "CSE470", title: "Software Engineering", category: "core" },

  // Electives
  { code: "CSE320", title: "Data Communications", category: "electives" },
  { code: "CSE428", title: "Digital Image Processing", category: "electives" },
  { code: "CSE437", title: "Data Science", category: "electives" },
  { code: "CSE440", title: "Natural Language Processing", category: "electives" },
  { code: "CSE471", title: "System Analysis and Design", category: "electives" },
  { code: "CSE489", title: "Mobile Application Development", category: "electives" },

  // Mathematics & Science
  { code: "MAT110", title: "Mathematics I: Calculus", category: "math" },
  { code: "MAT120", title: "Mathematics II: Calculus", category: "math" },
  { code: "MAT215", title: "Differential Equations", category: "math" },
  { code: "MAT216", title: "Linear Algebra", category: "math" },
  { code: "PHY111", title: "Physics I", category: "math" },
  { code: "PHY112", title: "Physics II", category: "math" },
  { code: "STA201", title: "Statistics & Probability", category: "math" },

  // General Education
  { code: "ENG101", title: "English Fundamentals", category: "gened" },
  { code: "ENG115", title: "English Composition", category: "gened" },
  { code: "CHE101", title: "Introduction to Chemistry", category: "gened" },
  { code: "BNG103", title: "Bangla Language & Literature", category: "gened" },
  { code: "HUM103", title: "Ethics & Culture", category: "gened" },
  { code: "ANT101", title: "Introduction to Anthropology", category: "gened" },
  { code: "BUS201", title: "Introduction to Business", category: "gened" },
  { code: "ECO101", title: "Introduction to Microeconomics", category: "gened" },
  { code: "EMB101", title: "Emergence of Bangladesh", category: "gened" },
  { code: "CST333", title: "Personal Finance for Sustainable Economic Wellbeing", category: "gened" },
];

export const countByCategory = (id: CategoryId): number =>
  courses.filter((c) => c.category === id).length;

export interface Stat {
  value: number;
  suffix: string;
  label: string;
  hint: string;
}

export const stats: Stat[] = [
  { value: 13000, suffix: "+", label: "Curated files", hint: "~1.08 GB archived" },
  { value: 39, suffix: "+", label: "Courses", hint: "across the full degree" },
  { value: 4, suffix: "", label: "Curriculum pillars", hint: "core · elective · math · gened" },
  { value: 8, suffix: "", label: "Resource types", hint: "notes to full projects" },
];

export const resourceTypes: string[] = [
  "Theory Notes",
  "Lecture Slides",
  "Lab Solutions",
  "Past Questions",
  "Practice Sheets",
  "Textbooks",
  "Projects",
  "Formula Sheets",
];

export interface Project {
  title: string;
  course: string;
  field: string;
  blurb: string;
  tags: string[];
  from: string;
  to: string;
  href: string;
}

export const projects: Project[] = [
  {
    title: "Star Wars · OpenGL",
    course: "CSE423",
    field: "Computer Graphics",
    blurb:
      "A real-time space shooter rendered from scratch with OpenGL: fixed-pipeline geometry, lighting and motion.",
    tags: ["OpenGL", "C / Python", "Real-time"],
    from: "var(--p1-from)",
    to: "var(--p1-to)",
    href: "https://github.com/ImtiazHossain-Eshan/Star-Wars-Developed-by-OpenGL",
  },
  {
    title: "Brain Tumor Segmentation",
    course: "CSE428",
    field: "Image Processing",
    blurb:
      "Deep-learning pipeline for MRI tumor segmentation and classification, from preprocessing to evaluation.",
    tags: ["Deep Learning", "Medical Imaging", "CNN"],
    from: "var(--p2-from)",
    to: "var(--p2-to)",
    href: "https://github.com/ImtiazHossain-Eshan/Brain-Tumor-Segmentation-Classification",
  },
  {
    title: "News Headline Classification",
    course: "CSE440",
    field: "Natural Language Processing",
    blurb:
      "Transformer-based classifier that sorts headlines into topics: tokenization, fine-tuning and inference.",
    tags: ["NLP", "Transformers", "Python"],
    from: "var(--p3-from)",
    to: "var(--p3-to)",
    href: "https://github.com/ImtiazHossain-Eshan/News-Headline-Topic-Classification",
  },
  {
    title: "AI-Generated Text Detection",
    course: "CSE437",
    field: "Natural Language Processing",
    blurb:
      "Distinguishes machine-generated text from human writing using fine-tuned language models and classic baselines.",
    tags: ["NLP", "Classification", "Transformers"],
    from: "var(--p4-from)",
    to: "var(--p4-to)",
    href: "https://github.com/ImtiazHossain-Eshan/AI-Generated-Text-Detection",
  },
  {
    title: "The Proposer's Dilemma",
    course: "ENG115",
    field: "AI · Game Theory",
    blurb:
      "A strategic bargaining game modelling the proposer's dilemma: agents, payoffs and equilibrium strategies.",
    tags: ["Game Theory", "AI", "Python"],
    from: "var(--p1-from)",
    to: "var(--p2-to)",
    href: "https://github.com/ImtiazHossain-Eshan/The-Proposer-s-Dilemma-game",
  },
];

export interface FlowStep {
  step: string;
  title: string;
  description: string;
}

export const flowSteps: FlowStep[] = [
  {
    step: "01",
    title: "Choose a course",
    description:
      "Jump straight to any of 39 courses, grouped exactly the way your degree is structured.",
  },
  {
    step: "02",
    title: "Open the materials",
    description:
      "Theory and Lab split cleanly: notes, slides, textbooks and references, one tap away.",
  },
  {
    step: "03",
    title: "Practice & revise",
    description:
      "Drill with practice sheets, then pressure-test yourself on years of past midterms and finals.",
  },
  {
    step: "04",
    title: "Build & submit",
    description:
      "Study full projects and solved labs end-to-end, from first commit to final report.",
  },
];
