import { getServerDatabase } from "@/lib/supabase";
import { sameOrigin } from "@/lib/http";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const raw = await request.text();
  if (raw.length > 2048) return new Response(null, { status: 413 });
  try {
    const b = JSON.parse(raw);
    if (
      !["page_view", "open", "copy", "save", "unsave"].includes(b.event) ||
      typeof b.visitor !== "string" ||
      !/^[a-f0-9-]{36}$/.test(b.visitor) ||
      typeof b.path !== "string" ||
      b.path.length > 200
    )
      return new Response(null, { status: 400 });
    const db = getServerDatabase();
    if (!db) return new Response(null, { status: 503 });
    const { error } = await db.rpc("record_visit", {
      visitor: b.visitor,
      event_name: b.event,
      content_slug: typeof b.slug === "string" ? b.slug.slice(0, 100) : null,
      page_path: b.path,
    });
    return new Response(null, { status: error ? 503 : 204 });
  } catch {
    return new Response(null, { status: 400 });
  }
}
