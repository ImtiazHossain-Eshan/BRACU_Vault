import type { ResourceType } from "./types";

/** Each resource type maps to a theme accent token (works in both themes). */
export const TYPE_TOKEN: Record<ResourceType, string> = {
  Notes: "--accent",
  Slides: "--accent-2",
  Assignments: "--accent-3",
  Questions: "--highlight",
  Solutions: "--accent-4",
  Projects: "--accent-2",
};
