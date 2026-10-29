import Link from "next/link";
import { Header } from "@/components/header";
export const metadata = { title: "Agent connection guide" };
export default function Page() {
  return (
    <>
      <Header />
      <main className="agent-guide">
        <h1>Connect an AI agent.</h1>
        <p>
          Give an agent a focused way to prepare your prompts, image references,
          and step-by-step guides. You control what it can change and when its
          access ends.
        </p>
        <Link href="/admin" className="button primary">
          Open admin workspace
        </Link>
        <a href="/PROJECT.md" className="button" download>
          Download project guide (.md)
        </a>
        <div className="guide-box">
          <h2>For the owner</h2>
          <ol>
            <li>Sign in to Admin and open AI agents.</li>
            <li>
              Name the agent, choose Draft only or Can publish, and set an
              expiry.
            </li>
            <li>
              Copy the key once into the agent’s private environment settings as
              ORIGIN_AGENT_KEY.
            </li>
            <li>
              Give the agent the project guide. Review drafts in your content
              library.
            </li>
            <li>Revoke its access when the work is finished.</li>
          </ol>
        </div>
        <h2>For the agent</h2>
        <p>
          Read the project guide before making changes. Use an HTTPS request to{" "}
          <code>/api/agent/content</code> with your key in the Authorization
          header. GET reads content; POST saves validated resource objects.
          Draft-only keys cannot alter published resources.
        </p>
        <pre>{`Authorization: Bearer <ORIGIN_AGENT_KEY>\nContent-Type: application/json\n\nGET  /api/agent/content\nPOST /api/agent/content`}</pre>
        <p>
          Provide separate inputImage and outputImage URLs. The website
          automatically displays them as an interactive comparison. Upload new
          binary images through a signed-in editor or a reviewed repository
          update; agent content keys do not grant media-upload or team access.
        </p>
        <h2>Keep access under your control</h2>
        <p>
          Agent keys cannot read passwords, subscribers, visitor statistics, or
          team settings. Do not give an agent the owner password. Keys expire
          and can be revoked immediately. Start with drafts and review the
          result before publishing.
        </p>
      </main>
    </>
  );
}
