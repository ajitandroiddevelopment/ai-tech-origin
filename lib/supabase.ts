import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const databaseConfigured = Boolean(url && key);
export function getBrowserDatabase() {
  return url && key ? createClient(url, key) : null;
}
export function getServerDatabase(token?: string) {
  return url && key
    ? createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : undefined,
      })
    : null;
}
