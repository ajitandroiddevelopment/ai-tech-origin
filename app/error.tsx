"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="empty-state">
      <p className="eyebrow">A BRIEF PAUSE</p>
      <h1>The library couldn’t load.</h1>
      <p>
        Please try again in a moment. Your saved resources are still kept on
        your device.
      </p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
      <p>
        <Link className="text-link" href="/admin">
          Creator studio
        </Link>
      </p>
    </main>
  );
}
