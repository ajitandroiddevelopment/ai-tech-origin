"use client";
import { useState, useId } from "react";
import { Check, LoaderCircle } from "lucide-react";
export function Subscribe({ compact = false }: { compact?: boolean }) {
  const id = useId();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const r = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          website: data.get("website"),
          consent: true,
        }),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error || "Please try again.");
      setDone(true);
      setStatus("You’re on the list. Look out for the next Origin Edit.");
      form.reset();
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to join. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className={`subscribe-form ${compact ? "compact" : ""}`}
      onSubmit={submit}
    >
      <label className="sr-only" htmlFor={id}>
        Your email address
      </label>
      <div className="email-field">
        <input
          id={id}
          name="email"
          type="email"
          placeholder="Your email address"
          required
          autoComplete="email"
          disabled={done}
        />
        <button
          disabled={busy || done}
          type="submit"
          aria-label="Subscribe to The Origin Edit"
        >
          {busy ? (
            <LoaderCircle size={19} className="spin" />
          ) : done ? (
            <Check size={20} />
          ) : (
            <span>Join</span>
          )}
        </button>
      </div>
      <input
        className="honeypot"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      <p className="subscribe-note">
        {status || <>Useful ideas. No noise. Unsubscribe anytime.</>}
      </p>
      {!done && (
        <span className="consent-note">
          By joining, you agree to receive The Origin Edit.{" "}
          <a href="/privacy">Privacy</a>
        </span>
      )}
    </form>
  );
}
