import { getServerDatabase } from "@/lib/supabase";
import { sameOrigin, unavailable } from "@/lib/http";
import { validateEmail } from "@/lib/validation.mjs";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Origin not allowed" }, { status: 403 });
  const raw = await request.text();
  if (raw.length > 2048)
    return Response.json({ error: "Request too large" }, { status: 413 });
  try {
    const body = JSON.parse(raw);
    if (body.website) return Response.json({ ok: true });
    if (!validateEmail(body.email) || body.consent !== true)
      return Response.json(
        { error: "Enter a valid email and agree to receive the newsletter." },
        { status: 400 },
      );
    const db = getServerDatabase();
    if (!db) return unavailable();
    const { error } = await db.rpc("join_newsletter", {
      subscriber_email: body.email.trim().toLowerCase(),
    });
    if (error) {
      console.error("Newsletter signup failed:", error.code);
      return unavailable();
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Invalid signup request" }, { status: 400 });
  }
}
