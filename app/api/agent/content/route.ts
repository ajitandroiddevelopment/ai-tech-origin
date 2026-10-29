import { getServerDatabase } from "@/lib/supabase";
import { sameOrigin } from "@/lib/http";
import { validateContent } from "@/lib/validation.mjs";
const reply = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
async function run(request: Request, operation: string) {
  const token =
    request.headers.get("authorization")?.replace(/^Bearer /i, "") || "";
  if (!/^ato_[a-f0-9]{64}$/.test(token))
    return reply({ error: "A valid agent key is required" }, 401);
  const db = getServerDatabase();
  if (!db) return reply({ error: "Database unavailable" }, 503);
  try {
    let records = null;
    if (operation === "write") {
      if (!sameOrigin(request))
        return reply({ error: "Origin not allowed" }, 403);
      const raw = await request.text();
      if (raw.length > 1000000)
        return reply({ error: "Import must be under 1 MB" }, 413);
      const body = JSON.parse(raw);
      const values = Array.isArray(body) ? body : [body];
      if (!values.length || values.length > 100)
        throw new Error("Supply 1–100 resources");
      records = values.map(validateContent);
    }
    const { data, error } = await db.rpc("agent_content", {
      agent_token: token,
      operation,
      records,
    });
    if (error)
      return reply(
        {
          error:
            error.code === "42501"
              ? "Agent key is expired, revoked, or lacks permission"
              : "Unable to process this request; check content and request limits",
        },
        error.code === "42501" ? 403 : 400,
      );
    return reply(data);
  } catch (e) {
    return reply(
      { error: e instanceof Error ? e.message : "Invalid content" },
      400,
    );
  }
}
export async function GET(request: Request) {
  return run(request, "read");
}
export async function POST(request: Request) {
  return run(request, "write");
}
