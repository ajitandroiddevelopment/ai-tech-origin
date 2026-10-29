import { getContent } from "@/lib/content";
import { editorDatabase, sameOrigin } from "@/lib/http";
import { validateContent } from "@/lib/validation.mjs";
export async function GET(request: Request) {
  if (request.headers.get("authorization")) {
    const db = await editorDatabase(request);
    if (!db)
      return Response.json(
        { error: "Editor access required" },
        { status: 403 },
      );
    const { data, error } = await db
      .from("content")
      .select("payload,published");
    if (error)
      return Response.json(
        { error: "Unable to load content" },
        { status: 503 },
      );
    return Response.json(
      {
        items: data.map((x) => ({ ...x.payload, published: x.published })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
  return Response.json({ items: await getContent() });
}
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Origin not allowed" }, { status: 403 });
  const db = await editorDatabase(request);
  if (!db)
    return Response.json({ error: "Editor access required" }, { status: 403 });
  const raw = await request.text();
  if (raw.length > 1000000)
    return Response.json(
      { error: "Content import is too large" },
      { status: 413 },
    );
  try {
    const body = JSON.parse(raw);
    const values = Array.isArray(body) ? body : [body];
    if (!values.length || values.length > 100)
      throw new Error("Import 1–100 resources at a time");
    const items = values.map(validateContent);
    const { error } = await db.from("content").upsert(
      items.map((item) => ({
        slug: item.slug,
        payload: item,
        published: item.published,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "slug" },
    );
    if (error)
      throw new Error("Unable to publish content. Check your editor access.");
    return Response.json({ saved: items.length });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid content" },
      { status: 400 },
    );
  }
}
