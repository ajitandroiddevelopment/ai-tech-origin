import { getServerDatabase } from "./supabase";
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}
export async function editorDatabase(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /i, "");
  if (!token) return null;
  const db = getServerDatabase(token);
  if (!db) return null;
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return null;
  const result = await db.rpc("editor_access");
  if (result.error || result.data !== true) return null;
  return db;
}
export const unavailable = () =>
  Response.json(
    {
      error: "The database connection is being set up. Please try again later.",
    },
    { status: 503 },
  );
