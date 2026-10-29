import { getServerDatabase } from "@/lib/supabase";
import { sameOrigin, unavailable } from "@/lib/http";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  try {
    const raw = await request.text();
    if (raw.length > 512) return new Response(null, { status: 413 });
    const { token } = JSON.parse(raw);
    if (
      typeof token !== "string" ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
        token,
      )
    )
      return Response.json(
        { error: "This unsubscribe link is invalid." },
        { status: 400 },
      );
    const db = getServerDatabase();
    if (!db) return unavailable();
    const { error } = await db.rpc("leave_newsletter", { token });
    if (error) return unavailable();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
