import Link from "next/link";
export const metadata = { title: "Privacy" };
export default function Page() {
  return (
    <main className="detail-main">
      <Link className="back-link" href="/">
        ← Back to AI Tech Origin
      </Link>
      <div className="detail-heading">
        <p className="eyebrow">YOUR DATA, CLEARLY EXPLAINED</p>
        <h1>Privacy, without the fine print.</h1>
      </div>
      <article className="newsletter-article">
        <p>
          Your saved resources, copied-prompt history, customized drafts, theme
          preference, and a random visitor identifier are stored in your
          browser. Clear your browser storage to remove them.
        </p>
        <p>
          Reference images you select on resource pages stay on your device.
          They are used for a local preview and are not uploaded by that page.
          Creator Studio uploads are explicitly selected by an authorized editor
          and stored as public website assets.
        </p>
        <p>
          If you sign in, your saved resource IDs are synchronized with your
          Supabase account. Your email is used for authentication and is not
          displayed publicly.
        </p>
        <p>
          If you join The Origin Edit, your email address and subscription
          consent time are stored privately. Only authorized editors can access
          the subscriber list. Newsletter delivery is managed separately;
          signing up does not expose your email to other visitors.
        </p>
        <p>
          We count page views, resource opens, copies, and saves using a random
          identifier. Our application does not store raw IP addresses or prompt
          text in visitor events. These counts describe browser activity, not a
          verified count of individual people. The hosting provider’s Web
          Analytics may also collect aggregated usage according to its settings.
        </p>
        <p>
          To request account or subscription removal, contact AI Tech Origin
          through the channel where you discovered this site. Do not post your
          sign-in links or account credentials publicly.
        </p>
      </article>
    </main>
  );
}
