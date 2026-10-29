"use client";
import { useState } from "react";
import { getBrowserDatabase } from "@/lib/supabase";
import { useApp } from "./providers";
export function StudioLogin() {
  const { signIn } = useApp();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <section className="studio-login workspace-panel">
      <h2>Admin sign-in</h2>
      <p>
        Use your admin email and password. For your first visit, use an email
        link, then set your password under My account.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setBusy(true);
          const r = await getBrowserDatabase()?.auth.signInWithPassword({
            email: String(f.get("email")),
            password: String(f.get("password")),
          });
          setBusy(false);
          setMessage(
            r?.error
              ? "Unable to sign in. Check your email and password, or use an email link."
              : "Signed in. Checking admin access…",
          );
        }}
      >
        <label>
          Email address
          <input type="email" name="email" required autoComplete="username" />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
          />
        </label>
        <button className="button primary" disabled={busy}>
          Sign in
        </button>
        <button type="button" className="button" onClick={signIn}>
          Use an email link instead
        </button>
      </form>
      <p role="status">{message}</p>
    </section>
  );
}
