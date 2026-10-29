"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";
import { getBrowserDatabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { X, Check, Mail } from "lucide-react";
type Saved = { slug: string; at: string };
type Recent = { slug: string; at: string };
type AppContext = {
  theme: string;
  toggleTheme: () => void;
  saved: Saved[];
  toggleSave: (slug: string) => void;
  recent: Recent[];
  copied: (slug: string) => void;
  toast: (message: string) => void;
  session: Session | null;
  signIn: () => void;
  signOut: () => void;
};
const Context = createContext<AppContext | null>(null);
export const useApp = () => useContext(Context)!;
export function trackEvent(name: string, slug?: string) {
  if (
    ["localhost", "127.0.0.1"].includes(location.hostname) ||
    location.pathname.startsWith("/admin")
  )
    return;
  try {
    let id = localStorage.getItem("origin.visitor");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("origin.visitor", id);
    }
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: name,
        slug,
        visitor: id,
        path: location.pathname,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}
export function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState("dark");
  const [saved, setSaved] = useState<Saved[]>([]);
  const [recent, setRecent] = useState<Recent[]>([]);
  const [message, setMessage] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [login, setLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const db = useMemo(() => getBrowserDatabase(), []);
  useEffect(() => {
    try {
      const t = localStorage.getItem("origin.theme") || "dark";
      setTheme(t);
      document.documentElement.dataset.theme = t;
      setSaved(JSON.parse(localStorage.getItem("origin.saved") || "[]"));
      setRecent(JSON.parse(localStorage.getItem("origin.recent") || "[]"));
    } catch {}
    trackEvent("page_view");
    if (!db) return;
    db.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = db.auth.onAuthStateChange((_, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, [db]);
  useEffect(() => {
    if (!db || !session) return;
    let cancelled = false;
    const sync = async () => {
      const { data, error } = await db
        .from("saved_items")
        .select("slug,created_at");
      if (cancelled || error) return;
      let local: Saved[] = [];
      try {
        local = JSON.parse(localStorage.getItem("origin.saved") || "[]");
      } catch {}
      const merged = new Map(local.map((x) => [x.slug, x]));
      for (const x of data ?? [])
        merged.set(x.slug, { slug: x.slug, at: x.created_at });
      const values = [...merged.values()];
      setSaved(values);
      localStorage.setItem("origin.saved", JSON.stringify(values));
      if (local.length)
        await db.from("saved_items").upsert(
          local.map((x) => ({
            user_id: session.user.id,
            slug: x.slug,
            created_at: x.at,
          })),
          { onConflict: "user_id,slug" },
        );
    };
    void sync();
    return () => {
      cancelled = true;
    };
  }, [db, session]);
  const toast = (text: string) => {
    setMessage(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(""), 3500);
  };
  const toggleSave = (slug: string) => {
    const exists = saved.some((x) => x.slug === slug);
    const next = exists
      ? saved.filter((x) => x.slug !== slug)
      : [{ slug, at: new Date().toISOString() }, ...saved];
    setSaved(next);
    localStorage.setItem("origin.saved", JSON.stringify(next));
    if (db && session) {
      const write = exists
        ? db
            .from("saved_items")
            .delete()
            .eq("user_id", session.user.id)
            .eq("slug", slug)
        : db
            .from("saved_items")
            .upsert(
              { user_id: session.user.id, slug },
              { onConflict: "user_id,slug" },
            );
      Promise.resolve(write).then(({ error }) => {
        if (error)
          toast(
            "Saved on this device. Account sync is temporarily unavailable.",
          );
      });
    }
    toast(exists ? "Removed from your saved library" : "Saved to your library");
    trackEvent(exists ? "unsave" : "save", slug);
  };
  const copied = (slug: string) => {
    const next = [
      { slug, at: new Date().toISOString() },
      ...recent.filter((x) => x.slug !== slug),
    ].slice(0, 50);
    setRecent(next);
    localStorage.setItem("origin.recent", JSON.stringify(next));
    toast("Prompt copied. Go make something good.");
    trackEvent("copy", slug);
  };
  const toggleTheme = () => {
    const t = theme === "dark" ? "light" : "dark";
    setTheme(t);
    localStorage.setItem("origin.theme", t);
    document.documentElement.dataset.theme = t;
  };
  const signIn = () => {
    if (!db) {
      toast(
        "Account sync will be available when the database is connected. Your saves stay on this device.",
      );
      return;
    }
    setLogin(true);
  };
  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    if (!db) return;
    setLoginMessage("Sending your sign-in link…");
    const { error } = await db.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          window.location.origin +
          (window.location.pathname.startsWith("/admin") ? "/admin" : "/"),
      },
    });
    setLoginMessage(
      error ? error.message : "Check your email for a secure sign-in link.",
    );
  }
  return (
    <Context.Provider
      value={{
        theme,
        toggleTheme,
        saved,
        toggleSave,
        recent,
        copied,
        toast,
        session,
        signIn,
        signOut: () => {
          void db?.auth.signOut();
        },
      }}
    >
      {children}
      {message && (
        <div className="toast" role="status">
          <Check size={17} />
          {message}
        </div>
      )}
      {login && (
        <div className="modal-backdrop" onClick={() => setLogin(false)}>
          <section
            className="login-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="icon-button modal-close"
              aria-label="Close sign in"
              onClick={() => setLogin(false)}
            >
              <X />
            </button>
            <Mail size={28} />
            <h2 id="login-title">Keep your good finds.</h2>
            <p>
              Get a secure email link to sign in. Admins can set a password in
              My account after signing in.
            </p>
            <form onSubmit={sendLink}>
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="button primary" type="submit">
                Send sign-in link
              </button>
            </form>
            <p role="status">{loginMessage}</p>
          </section>
        </div>
      )}
    </Context.Provider>
  );
}
