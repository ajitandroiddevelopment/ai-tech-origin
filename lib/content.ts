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
    .filter((x) => x.published)
    .map((item) => ({
      ...item,
      cover: cleanArtwork(item.cover),
      inputImage: item.inputImage ? cleanArtwork(item.inputImage) : undefined,
      outputImage: item.outputImage
        ? cleanArtwork(item.outputImage)
        : undefined,
    }));
});
function cleanArtwork(src: string) {
  return src === "/brand/space-editorial.png"
    ? "/art/editorial.svg"
    : src === "/brand/focus-rule.png"
      ? "/art/learning.svg"
      : src;
}
