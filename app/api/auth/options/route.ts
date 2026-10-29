export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    return Response.json(
      { google: false, email: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  try {
    const r = await fetch(new URL("/auth/v1/settings", url), {
      headers: { apikey: key },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error("Unavailable");
    const data = await r.json();
    return Response.json(
      {
        google: data.external?.google === true,
        email: data.external?.email === true,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Sign-in options could not be checked. Please try again." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
