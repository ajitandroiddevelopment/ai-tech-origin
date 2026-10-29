"use client";
import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Copy, KeyRound, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { getBrowserDatabase } from "@/lib/supabase";
import { useApp } from "./providers";
type Member = { email: string; role: string; verified: boolean };
type AgentKey = {
  id: string;
  label: string;
  scope: string;
  expires_at: string;
  revoked_at: string | null;
  last_used_at: string | null;
};
type Workspace = {
  members: Member[];
  keys: AgentKey[];
  activity: { action: string; subject?: string; created_at: string }[];
};
export function AdminWorkspace({
  mode,
  session,
}: {
  mode: string;
  session: Session;
}) {
  const { toast } = useApp();
  const [data, setData] = useState<Workspace | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [secret, setSecret] = useState("");
  const [password, setPassword] = useState("");
  const [done, setDone] = useState("");
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/workspace", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setData(d);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load workspace");
    }
  }, [session.access_token]);
  useEffect(() => {
    if (mode !== "account") void load();
  }, [load, mode]);
  async function action(body: Record<string, unknown>) {
    setBusy(true);
    setDone("");
    try {
      const r = await fetch("/api/admin/workspace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (d.token) setSecret(d.token);
      const msg = d.message || "Changes saved";
      setDone(msg);
      toast(msg);
      await load();
      return true;
    } catch (e) {
      toast(e instanceof Error ? e.message : "Unable to save");
      return false;
    } finally {
      setBusy(false);
    }
  }
  if (mode === "account")
    return (
      <section className="workspace-panel">
        <ShieldCheck size={28} />
        <h2>Your account</h2>
        <p>
          Signed in as <strong>{session.user.email}</strong>. Set a password
          after signing in with your email link, or change your own password
          here.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const db = getBrowserDatabase();
            const r = await db?.auth.updateUser({ password });
            setBusy(false);
            if (r?.error) toast(r.error.message);
            else {
              setPassword("");
              toast("Your password has been updated");
            }
          }}
        >
          <label>
            New password
            <input
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="button primary" disabled={busy}>
            Save my password
          </button>
        </form>
        <p className="field-hint">
          Passwords are handled by Supabase Auth. They cannot be viewed later in
          this panel. Your browser’s password manager can remember your own
          login.
        </p>
      </section>
    );
  if (error)
    return (
      <section className="workspace-panel">
        <h2>Owner access</h2>
        <p>
          {error}. Additional admins can manage content; the owner manages team
          members and agent keys.
        </p>
        <button className="button" onClick={load}>
          Check again
        </button>
      </section>
    );
  if (!data) return <p role="status">Loading workspace…</p>;
  return (
    <section className="workspace-panel">
      {mode === "team" ? (
        <>
          <h2>Admins & access</h2>
          <p>
            Add an admin by email. They must verify that email before they can
            edit or publish. The owner account stays protected.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = e.currentTarget;
              const form = new FormData(f);
              if (
                await action({
                  operation: "add_admin",
                  email: form.get("email"),
                  password: form.get("password"),
                })
              )
                f.reset();
            }}
          >
            <div className="workspace-form-row">
              <label>
                Admin email
                <input name="email" type="email" required autoComplete="off" />
              </label>
              <label>
                Initial password (optional)
                <input
                  name="password"
                  type="password"
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                />
              </label>
            </div>
            <button className="button primary" disabled={busy}>
              <Plus size={18} /> Add admin
            </button>
          </form>
          <p className="field-hint">
            An initial password only applies to a new account. Existing users
            keep their password. Passwords are never shown or saved in content
            records.
          </p>
          <div className="member-list">
            {data.members.map((m) => (
              <div className="member-row" key={m.email}>
                <div>
                  <strong>{m.email}</strong>
                  <span>
                    {m.role === "owner"
                      ? "Owner"
                      : m.verified
                        ? "Admin · email verified"
                        : "Admin · awaiting email verification"}
                  </span>
                </div>
                {m.role !== "owner" && (
                  <button
                    className="button"
                    disabled={busy}
                    onClick={() =>
                      action({ operation: "remove_admin", email: m.email })
                    }
                  >
                    <Trash2 size={16} /> Remove access
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <h2>AI agent access</h2>
          <p>
            Create a separate key for each agent. Start with draft-only access
            so you can review its work before publishing. Keys never grant
            access to passwords, team management, subscribers, or analytics.
          </p>
          <a
            href="/agent-access"
            className="button"
            target="_blank"
            rel="noreferrer"
          >
            Open agent connection guide
          </a>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = e.currentTarget;
              const form = new FormData(f);
              if (
                await action({
                  operation: "create_key",
                  label: form.get("label"),
                  scope: form.get("scope"),
                  days: Number(form.get("days")),
                })
              )
                f.reset();
            }}
          >
            <div className="workspace-form-row">
              <label>
                Agent name
                <input
                  name="label"
                  required
                  maxLength={100}
                  placeholder="e.g. Codex content editor"
                />
              </label>
              <label>
                Permission
                <select name="scope" defaultValue="draft">
                  <option value="draft">Create and edit drafts</option>
                  <option value="publish">Manage and publish content</option>
                </select>
              </label>
              <label>
                Expires after
                <select name="days" defaultValue="7">
                  <option value="1">1 day</option>
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                </select>
              </label>
            </div>
            <button className="button primary" disabled={busy}>
              <KeyRound size={18} /> Create agent key
            </button>
          </form>
          {secret && (
            <div className="agent-secret" role="status">
              <h3>Copy this key now</h3>
              <p>
                It is only shown once. Store it in your agent’s private
                environment settings. Do not put it in prompts, GitHub, URLs, or
                the project guide.
              </p>
              <code>{secret}</code>
              <div>
                <button
                  className="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(secret);
                      toast("Agent key copied");
                    } catch {
                      toast("Select the key and copy it manually");
                    }
                  }}
                >
                  <Copy size={17} /> Copy key
                </button>
                <button className="button" onClick={() => setSecret("")}>
                  I’ve saved it
                </button>
              </div>
            </div>
          )}
          <div className="member-list">
            {data.keys.map((k) => (
              <div className="member-row" key={k.id}>
                <div>
                  <strong>{k.label}</strong>
                  <span>
                    {k.scope === "draft" ? "Draft only" : "Can publish"} ·{" "}
                    {k.revoked_at
                      ? "Revoked"
                      : new Date(k.expires_at) < new Date()
                        ? "Expired"
                        : "Expires " +
                          new Date(k.expires_at).toLocaleDateString()}
                  </span>
                </div>
                {!k.revoked_at && (
                  <button
                    className="button"
                    disabled={busy}
                    onClick={() =>
                      action({ operation: "revoke_key", id: k.id })
                    }
                  >
                    Revoke access
                  </button>
                )}
              </div>
            ))}
            {!data.keys.length && <p>No agents connected yet.</p>}
          </div>
          <h3>Recent access activity</h3>
          <div className="activity-list">
            {data.activity.map((a, i) => (
              <p key={i}>
                <span>
                  {a.action.replaceAll("_", " ")}
                  {a.subject ? " · " + a.subject : ""}
                </span>
                <time>{new Date(a.created_at).toLocaleString()}</time>
              </p>
            ))}
            {!data.activity.length && (
              <p>
                Actions will appear here as your team and agents use the
                workspace.
              </p>
            )}
          </div>
        </>
      )}
      {done && (
        <p role="status" className="workspace-feedback">
          {done}
        </p>
      )}
    </section>
  );
}
