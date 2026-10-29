import seed from "@/content/library.json";
import type { Content } from "./types";
import { getServerDatabase } from "./supabase";
import { cache } from "react";
export const getContent = cache(async (): Promise<Content[]> => {
  const db = getServerDatabase();
  if (!db) return (seed as Content[]).filter((x) => x.published);
  const { data, error } = await db
    .from("content")
    .select("payload,published")
    .eq("published", true)
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("Content database unavailable:", error.code);
    throw new Error("The resource library is temporarily unavailable.");
  }
  return (data ?? [])
    .map((row) => ({ ...row.payload, published: row.published }) as Content)
    .filter((x) => x.published);
});
