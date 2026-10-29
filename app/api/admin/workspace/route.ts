import { randomBytes, createHash } from "node:crypto";
import { editorDatabase, sameOrigin } from "@/lib/http";
import { getServerDatabase } from "@/lib/supabase";
import { validateEmail } from "@/lib/validation.mjs";
const reply = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function GET(request: Request) {
  const db = await editorDatabase(request);
  if (!db) return reply({ error: "Owner access required" }, 403);
  const { data, error } = await db.rpc("owner_workspace", {
    operation: "list",
  });
  return error
    ? reply({ error: "Owner access required or workspace not configured" }, 403)
    : reply(data);
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return reply({ error: "Origin not allowed" }, 403);
  const db = await editorDatabase(request);
  if (!db) return reply({ error: "Owner access required" }, 403);
  const owner = await db.rpc("owner_workspace", { operation: "list" });
  if (owner.error) return reply({ error: "Owner access required" }, 403);
  const raw = await request.text();
  if (raw.length > 5000) return reply({ error: "Request too large" }, 413);
  try {
    const body = JSON.parse(raw);
    const operation = body.operation;
    if (operation === "create_key") {
      if (
        typeof body.label !== "string" ||
        !body.label.trim() ||
        body.label.length > 100 ||
        !["draft", "publish"].includes(body.scope) ||
        ![1, 7, 30, 90].includes(body.days)
      )
        throw new Error("Choose a key label, permission, and expiry");
      const token = "ato_" + randomBytes(32).toString("hex");
      const { data, error } = await db.rpc("owner_workspace", {
        operation,
        details: {
          label: body.label,
          scope: body.scope,
          days: body.days,
          hash: createHash("sha256").update(token).digest("hex"),
        },
      });
      if (error) throw new Error("Unable to create agent key");
      return reply({ ...data, token });
    }
    if (operation === "add_admin") {
      const email = String(body.email || "")
        .trim()
        .toLowerCase();
      if (!validateEmail(email)) throw new Error("Enter a valid email");
      if (
        body.password &&
        (typeof body.password !== "string" ||
          body.password.length < 12 ||
          body.password.length > 128)
      )
        throw new Error("Initial passwords must be 12–128 characters");
      const { error } = await db.rpc("owner_workspace", {
        operation,
        details: { email },
      });
      if (error) throw new Error("Unable to add this admin");
      let message =
        "Admin access added. They can sign in with an email link, then set their own password.";
      if (body.password) {
        const auth = getServerDatabase();
        if (!auth) throw new Error("Authentication unavailable");
        const { error: signupError } = await auth.auth.signUp({
          email,
          password: body.password,
          options: {
            emailRedirectTo: new URL(
              "/admin",
              process.env.NEXT_PUBLIC_SITE_URL || request.url,
            ).href,
          },
        });
        message = signupError
          ? "Admin access added, but email delivery could not complete. Configure production SMTP in Supabase before onboarding external addresses. Existing accounts keep their current password."
          : "Admin access added. New accounts must verify their email before publishing. Existing accounts keep their current password.";
      }
      return reply({ ok: true, message });
    }
    if (!["remove_admin", "revoke_key"].includes(operation))
      throw new Error("Unknown action");
    const { error } = await db.rpc("owner_workspace", {
      operation,
      details:
        operation === "remove_admin" ? { email: body.email } : { id: body.id },
    });
    if (error)
      throw new Error(
        operation === "remove_admin"
          ? "The owner cannot be removed; check the admin email"
          : "Unable to revoke this key",
      );
    return reply({ ok: true });
  } catch (e) {
    return reply(
      { error: e instanceof Error ? e.message : "Request failed" },
      400,
    );
  }
}
