import seed from "@/content/library.json";
import type { Content } from "./types";
import { getServerDatabase } from "./supabase";
export async function getContent(): Promise<Content[]> {
  const originals = seed as Content[];
  const db = getServerDatabase();
  if (!db) return originals.filter((x) => x.published);
  const { data, error } = await db
    .from("content")
    .select("slug,payload,published");
  if (error) {
    console.error("Content database unavailable:", error.code);
    return originals.filter((x) => x.published);
  }
  const map = new Map(originals.map((x) => [x.slug, x]));
  for (const row of data ?? []) {
    map.set(row.slug, { ...row.payload, published: row.published });
  }
  return [...map.values()]
    .filter((x) => x.published)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
