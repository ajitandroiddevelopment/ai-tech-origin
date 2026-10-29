export type Category = "create" | "work" | "learn";
export type Variable = { key: string; label: string; default: string };
export type Step = { title: string; description: string; prompt?: string };
export type Content = {
  slug: string;
  title: string;
  summary: string;
  category: Category;
  kind: "prompt" | "guide" | "newsletter";
  collection: string;
  model: string;
  cover: string;
  inputImage?: string;
  outputImage?: string;
  prompt?: string;
  variables: Variable[];
  steps: Step[];
  tags: string[];
  featured: boolean;
  published: boolean;
  publishedAt: string;
  readMinutes: number;
  body?: string[];
  imageLabel?: string;
};
export const categories = [
  { id: "all", label: "All resources" },
  { id: "create", label: "Create & Design" },
  { id: "work", label: "Work & Research" },
  { id: "learn", label: "Learn & Improve" },
] as const;
