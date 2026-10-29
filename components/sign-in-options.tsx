"use client";
import { useEffect, useId, useState } from "react";
import { Mail } from "lucide-react";
import { getBrowserDatabase } from "@/lib/supabase";
import { signInDestination, signInFailure } from "@/lib/auth-feedback.mjs";
export function SignInOptions() {
  const id = useId();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<"google" | "email" | null>(null);
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    setMessage(signInFailure(window.location.hash));
  }, []);
  useEffect(() => {
    if (!cooldown) return;
    const tick = setTimeout(() => setCooldown((n) => Math.max(0, n - 1)), 1000);
    return () => clearTimeout(tick);
  }, [cooldown]);
  async function google() {
    const db = getBrowserDatabase();
    if (!db) {
      setMessage("Sign-in is temporarily unavailable. Please try again later.");
      return;
    }
    setBusy("google");
    setMessage("");
    try {
      const r = await fetch("/api/auth/options", { cache: "no-store" });
      const options = await r.json();
      if (!r.ok)
        throw new Error("Sign-in could not be checked. Please try again.");
      if (!options.google) {
        setMessage(
          "Google sign-in is waiting for the site owner to finish the Google connection. Email-link sign-in is available below.",
        );
        return;
      }
      const { data, error } = await db.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo:
            window.location.origin +
            signInDestination(window.location.pathname),
          queryParams: { prompt: "select_account" },
          skipBrowserRedirect: true,
        },
      });
      if (error || !data.url)
        throw new Error("Google sign-in could not start. Please try again.");
      window.location.assign(data.url);
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Unable to start Google sign-in.",
      );
    } finally {
      setBusy(null);
    }
  }
  async function emailLink(e: React.FormEvent) {
    e.preventDefault();
    if (busy || cooldown) return;
    const db = getBrowserDatabase();
    if (!db) {
      setMessage("Sign-in is temporarily unavailable.");
      return;
    }
    setBusy("email");
    setMessage("");
    try {
      const { error } = await db.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo:
            window.location.origin +
            signInDestination(window.location.pathname),
        },
      });
      if (error) {
        if (error.status === 429) {
          setCooldown(60);
          setMessage(
            "Please wait before requesting another email. Use the latest link already sent, or try again after the countdown.",
          );
        } else if (error.code === "email_address_not_authorized") {
          setMessage(
            "Email delivery is not available for this address yet. Please contact the site owner or use Google when available.",
          );
        } else
          setMessage(
            "We could not send the email link. Please try again later.",
          );
      } else {
        setCooldown(60);
        setMessage(
          "Check your inbox and spam folder. Open the latest sign-in email; older links may no longer work.",
        );
      }
    } catch {
      setMessage("The connection was interrupted. Please try again.");
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="sign-in-options">
      <button
        className="button google-sign-in"
        type="button"
        onClick={google}
        disabled={busy !== null}
      >
        <GoogleMark />
        {busy === "google" ? "Connecting to Google…" : "Continue with Google"}
      </button>
      <div className="sign-in-divider">
        <span />
        or
        <span />
      </div>
      <form onSubmit={emailLink}>
        <label htmlFor={id}>Email address</label>
        <input
          id={id}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy !== null}
        />
        <button
          className="button primary email-sign-in"
          type="submit"
          disabled={busy !== null || cooldown > 0}
        >
          <Mail size={18} />
          {busy === "email"
            ? "Sending link…"
            : cooldown > 0
              ? `Request again in ${cooldown}s`
              : "Continue with email"}
        </button>
      </form>
      <p className="auth-feedback" role="status" aria-live="polite">
        {message}
      </p>
      <p className="auth-explainer">
        We’ll send a secure sign-in link. No password needed.
      </p>
    </div>
  );
}
function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.5-.1-3-.4-4.5H24v8.5h11a9.5 9.5 0 0 1-4.1 6.2v5.2h6.6c3.9-3.6 6.1-8.9 6.1-15.4Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-5l-6.6-5.1a12.3 12.3 0 0 1-18.3-6.5H5.8v5.3A20.4 20.4 0 0 0 24 44Z"
      />
      <path
        fill="#FBBC05"
        d="M12.6 27.4a12.2 12.2 0 0 1 0-7.8v-5.3H5.8a20 20 0 0 0 0 18.4l6.8-5.3Z"
      />
      <path
        fill="#EA4335"
        d="M24 12.2c3 0 5.6 1 7.7 3l5.8-5.8A19.4 19.4 0 0 0 24 4 20.4 20.4 0 0 0 5.8 14.3l6.8 5.3A12 12 0 0 1 24 12.2Z"
      />
    </svg>
  );
}
