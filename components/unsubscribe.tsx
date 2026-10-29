"use client";
import { useState } from "react";
import Link from "next/link";
export function Unsubscribe() {
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  async function leave() {
    const token = new URLSearchParams(location.search).get("token");
    const response = await fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const result = await response.json();
    if (response.ok) {
      setDone(true);
      setMessage(
        "Your subscription has been removed. You can still explore the library anytime.",
      );
    } else setMessage(result.error || "Please try again later.");
  }
  return (
    <main className="empty-state">
      <p className="eyebrow">THE ORIGIN EDIT</p>
      <h1>A little less in your inbox.</h1>
      <p>Confirm below to stop receiving The Origin Edit.</p>
      {!done && (
        <button className="button primary" onClick={leave}>
          Unsubscribe
        </button>
      )}
      <p role="status">{message}</p>
      <Link className="text-link" href="/">
        Back to AI Tech Origin
      </Link>
    </main>
  );
}
