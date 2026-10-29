import Link from "next/link";
export default function NotFound() {
  return (
    <main className="empty-state">
      <p className="eyebrow">404 / WRONG TURN</p>
      <h1>This idea hasn’t landed yet.</h1>
      <p>There’s plenty more to explore in the library.</p>
      <Link className="button primary" href="/">
        Back to the hub
      </Link>
    </main>
  );
}
