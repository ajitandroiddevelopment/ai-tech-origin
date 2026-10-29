"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Content, Step, Variable } from "@/lib/types";
import seed from "@/content/library.json";
import { getBrowserDatabase, databaseConfigured } from "@/lib/supabase";
import { validateContent } from "@/lib/validation.mjs";
import { useApp } from "./providers";
import { Header } from "./header";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  BarChart3,
  Download,
  FileJson,
  ImagePlus,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
const blank: Content = {
  slug: "",
  title: "",
  summary: "",
  category: "create",
  kind: "prompt",
  collection: "",
  model: "",
  cover: "/art/editorial.svg",
  prompt: "",
  variables: [],
  steps: [],
  tags: [],
  featured: false,
  published: false,
  publishedAt: new Date().toISOString().slice(0, 10),
  readMinutes: 3,
  body: [],
};
type Metrics = {
  visitors: number;
  views: number;
  copies: number;
  saves: number;
  subscribers: number;
  daily: { day: string; views: number }[];
  top: { slug: string; opens: number }[];
};
export function Admin() {
  const { session, signIn, signOut, toast } = useApp();
  const db = useMemo(() => getBrowserDatabase(), []);
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [items, setItems] = useState<Content[]>(seed as Content[]);
  const [editing, setEditing] = useState<Content | null>(null);
  const [tab, setTab] = useState("content");
  const [busy, setBusy] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!session || !db) {
      setChecking(false);
      setAllowed(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setChecking(true);
      const access = await db.rpc("editor_access");
      if (cancelled) return;
      setAllowed(access.data === true);
      setChecking(false);
      if (access.data !== true) return;
      const [{ data }, stats] = await Promise.all([
        db.from("content").select("payload,published"),
        db.rpc("editor_metrics"),
      ]);
      if (cancelled) return;
      const map = new Map((seed as Content[]).map((x) => [x.slug, x]));
      for (const r of data ?? [])
        map.set(r.payload.slug, { ...r.payload, published: r.published });
      setItems([...map.values()]);
      if (!stats.error) setMetrics(stats.data);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [db, session]);
  function edit(item: Content) {
    setEditing(structuredClone(item));
    setTab("editor");
    setNotice("");
  }
  function update<K extends keyof Content>(key: K, value: Content[K]) {
    setEditing((x) => (x ? { ...x, [key]: value } : x));
  }
  function download(data: unknown, name: string) {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function save(publish: boolean) {
    if (!editing) return;
    let value: Content;
    try {
      value = validateContent({ ...editing, published: publish }) as Content;
    } catch (e) {
      toast(e instanceof Error ? e.message : "Check the resource fields");
      return;
    }
    if (!allowed || !session) {
      download(value, value.slug + ".json");
      toast("JSON exported. Cloud publishing requires editor sign-in.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(value),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setItems((prev) => [...prev.filter((x) => x.slug !== value.slug), value]);
      setEditing(value);
      toast(
        publish ? "Published. Your resource is live." : "Draft saved privately",
      );
    } catch (e) {
      toast(e instanceof Error ? e.message : "Unable to save");
    } finally {
      setBusy(false);
    }
  }
  async function upload(
    file: File | undefined,
    field: "cover" | "inputImage" | "outputImage",
  ) {
    if (!file || !editing) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 12582912
    ) {
      toast("Use JPG, PNG, or WebP under 12 MB");
      return;
    }
    if (!db || !allowed) {
      toast("Connect the database and sign in as an editor to upload media.");
      return;
    }
    setBusy(true);
    try {
      const path = `${editing.slug || "draft"}/${crypto.randomUUID()}.${file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1]}`;
      const { error } = await db.storage
        .from("origin-media")
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
          cacheControl: "31536000",
        });
      if (error) throw error;
      const { data } = db.storage.from("origin-media").getPublicUrl(path);
      update(field, data.publicUrl);
      toast("Image uploaded. Save the resource to publish this change.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }
  async function importJSON(file?: File) {
    if (!file) return;
    if (file.size > 1000000) {
      toast("Import must be under 1 MB");
      return;
    }
    try {
      const raw = JSON.parse(await file.text());
      const records = (Array.isArray(raw) ? raw : [raw]).map(
        validateContent,
      ) as Content[];
      if (records.length > 100) throw new Error("Import up to 100 resources");
      if (allowed && session) {
        setBusy(true);
        const r = await fetch("/api/content", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(records),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
      }
      setItems((prev) => [
        ...prev.filter((x) => !records.some((r) => r.slug === x.slug)),
        ...records,
      ]);
      toast(
        allowed
          ? "Content imported and saved"
          : "Imported into this preview. Export your changes to keep them.",
      );
    } catch (e) {
      toast(e instanceof Error ? e.message : "Invalid JSON");
    } finally {
      setBusy(false);
    }
  }
  async function subscribers() {
    if (!db || !allowed) return;
    const { data, error } = await db
      .from("newsletter_subscribers")
      .select("email,consent_at,status,unsubscribe_token");
    if (error) {
      toast("Unable to export subscribers");
      return;
    }
    download(
      data?.map((row) => ({
        email: row.email,
        consent_at: row.consent_at,
        status: row.status,
        unsubscribe_url: `${window.location.origin}/unsubscribe?token=${row.unsubscribe_token}`,
      })),
      "origin-newsletter-subscribers.json",
    );
  }
  function moveStep(i: number, d: number) {
    if (!editing) return;
    const next = [...editing.steps];
    const target = i + d;
    if (target < 0 || target >= next.length) return;
    [next[i], next[target]] = [next[target], next[i]];
    update("steps", next);
  }
  return (
    <>
      <Header />
      <main className="admin-main">
        <div className="studio-heading">
          <div>
            <p className="eyebrow">THE SPACE BEHIND THE SCENES</p>
            <h1>Creator studio.</h1>
            <p>Add a good idea. Give it a home.</p>
          </div>
          <div className="studio-actions">
            <button
              className="button"
              onClick={() => download(items, "origin-library.json")}
            >
              <Download size={15} /> Export library
            </button>
            <label className="button import-button">
              <Upload size={15} /> Import JSON
              <input
                type="file"
                accept="application/json"
                onChange={(e) => importJSON(e.target.files?.[0])}
              />
            </label>
            <button className="button primary" onClick={() => edit(blank)}>
              <Plus size={16} /> New resource
            </button>
          </div>
        </div>
        <div className="studio-status">
          {!databaseConfigured ? (
            <>
              <span className="status-dot" /> Local preview · Connect Supabase
              to publish, upload media, collect subscribers, and view visitor
              counts.
            </>
          ) : checking ? (
            "Checking your editor access…"
          ) : allowed ? (
            <>
              Signed in as {session?.user.email} · Your content is backed by
              Supabase.{" "}
              <button className="text-link" onClick={signOut}>
                Sign out
              </button>
            </>
          ) : (
            <>
              Your studio is protected.{" "}
              {session ? "This account is not on the editor list. " : ""}
              <button className="text-link" onClick={signIn}>
                Sign in as the owner <ArrowUpRight size={14} />
              </button>
            </>
          )}
        </div>
        <nav className="studio-tabs" aria-label="Creator studio">
          <button
            className={tab === "content" ? "active" : ""}
            onClick={() => setTab("content")}
          >
            Content library <span>{items.length}</span>
          </button>
          <button
            className={tab === "analytics" ? "active" : ""}
            onClick={() => setTab("analytics")}
          >
            Visitor overview
          </button>
          {editing && (
            <button
              className={tab === "editor" ? "active" : ""}
              onClick={() => setTab("editor")}
            >
              Resource editor
            </button>
          )}
        </nav>
        {tab === "content" && (
          <div className="content-table">
            {items.map((item) => (
              <button
                key={item.slug}
                className="content-row"
                onClick={() => edit(item)}
              >
                <img src={item.cover} alt="" />
                <div>
                  <strong>{item.title}</strong>
                  <span>
                    {item.collection} / {item.kind}
                  </span>
                </div>
                <span className="publish-status">
                  {item.published ? "Published" : "Draft"}
                </span>
                <ArrowUpRight size={19} />
              </button>
            ))}
          </div>
        )}
        {tab === "analytics" && (
          <section className="studio-analytics">
            <div className="section-heading">
              <div>
                <p className="eyebrow">THE LAST 30 DAYS</p>
                <h2>A clearer view of your audience.</h2>
              </div>
              {allowed && (
                <button className="button" onClick={subscribers}>
                  <Download size={15} /> Export subscribers
                </button>
              )}
            </div>
            {metrics ? (
              <>
                <div className="metric-grid">
                  {[
                    ["Visitors", metrics.visitors],
                    ["Page views", metrics.views],
                    ["Prompt copies", metrics.copies],
                    ["Saves", metrics.saves],
                    ["Subscribers", metrics.subscribers],
                  ].map(([label, n]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>{n}</strong>
                    </div>
                  ))}
                </div>
                <div className="metrics-detail">
                  <div>
                    <h3>Daily page views</h3>
                    {metrics.daily.length ? (
                      <div className="daily-chart">
                        {metrics.daily.map((d) => (
                          <div
                            key={d.day}
                            title={`${d.day}: ${d.views} page views`}
                          >
                            <span
                              style={{
                                height: `${Math.max(4, (d.views / Math.max(...metrics.daily.map((x) => x.views))) * 130)}px`,
                              }}
                            />
                            <small>{d.day.slice(5)}</small>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>
                        Visitor activity will appear here after people use your
                        site.
                      </p>
                    )}
                  </div>
                  <div>
                    <h3>Most explored</h3>
                    {metrics.top.map((t) => (
                      <p className="top-resource" key={t.slug}>
                        {items.find((i) => i.slug === t.slug)?.title || t.slug}
                        <strong>{t.opens}</strong>
                      </p>
                    ))}
                    {!metrics.top.length && (
                      <p>No resource opens recorded yet.</p>
                    )}
                  </div>
                </div>
                <p className="privacy-caption">
                  Counts use a random browser identifier. They are activity
                  estimates, not verified unique people. Subscriber count is the
                  current total. No raw IP addresses or prompt text are stored
                  in this dashboard.
                </p>
              </>
            ) : (
              <div className="empty-state">
                <BarChart3 size={35} />
                <h3>Your audience, without guesswork.</h3>
                <p>
                  {databaseConfigured
                    ? "Sign in as an authorized editor to see real visitor activity."
                    : "Connect Supabase to start recording real visits, copies, saves, and subscribers. No sample counts are shown."}
                </p>
                {databaseConfigured && (
                  <button className="button" onClick={signIn}>
                    Sign in to view analytics
                  </button>
                )}
              </div>
            )}
          </section>
        )}
        {tab === "editor" && editing && (
          <section className="editor-layout">
            <div className="editor-form">
              <div className="section-heading">
                <h2>{editing.title || "A new starting point."}</h2>
                <button
                  className="icon-button"
                  aria-label="Close editor"
                  onClick={() => setTab("content")}
                >
                  <X size={18} />
                </button>
              </div>
              <label>
                Title
                <input
                  value={editing.title}
                  onChange={(e) => update("title", e.target.value)}
                />
              </label>
              <div className="form-columns">
                <label>
                  URL slug
                  <input
                    value={editing.slug}
                    onChange={(e) => update("slug", e.target.value)}
                    placeholder="your-resource-name"
                  />
                </label>
                <label>
                  Collection
                  <input
                    value={editing.collection}
                    onChange={(e) => update("collection", e.target.value)}
                    placeholder="e.g. Product & brand design"
                  />
                </label>
              </div>
              <label>
                Short description
                <textarea
                  value={editing.summary}
                  onChange={(e) => update("summary", e.target.value)}
                  rows={3}
                />
              </label>
              <div className="form-columns">
                <label>
                  Section
                  <select
                    value={editing.category}
                    onChange={(e) =>
                      update("category", e.target.value as Content["category"])
                    }
                  >
                    <option value="create">Create & Design</option>
                    <option value="work">Work & Research</option>
                    <option value="learn">Learn & Improve</option>
                  </select>
                </label>
                <label>
                  Format
                  <select
                    value={editing.kind}
                    onChange={(e) =>
                      update("kind", e.target.value as Content["kind"])
                    }
                  >
                    <option value="prompt">Prompt</option>
                    <option value="guide">Step-by-step guide</option>
                    <option value="newsletter">Newsletter issue</option>
                  </select>
                </label>
              </div>
              <label>
                Suggested tool
                <input
                  value={editing.model}
                  onChange={(e) => update("model", e.target.value)}
                  placeholder="ChatGPT, Codex, or any writing assistant"
                />
              </label>
              <label>
                Prompt{" "}
                <span className="field-hint">
                  Use {"{{subject}}"} to add a customizable variable.
                </span>
                <textarea
                  value={editing.prompt || ""}
                  onChange={(e) => update("prompt", e.target.value)}
                  rows={8}
                />
              </label>
              <div className="editor-section-heading">
                <h3>Customization fields</h3>
                <button
                  className="text-link"
                  onClick={() =>
                    update("variables", [
                      ...editing.variables,
                      {
                        key: "field" + (editing.variables.length + 1),
                        label: "New field",
                        default: "",
                      },
                    ])
                  }
                >
                  <Plus size={14} /> Add field
                </button>
              </div>
              {editing.variables.map((v, i) => (
                <div className="variable-editor" key={i}>
                  {(["key", "label", "default"] as const).map((k) => (
                    <label key={k}>
                      {k}
                      <input
                        value={v[k]}
                        onChange={(e) =>
                          update(
                            "variables",
                            editing.variables.map((a, j) =>
                              i === j ? { ...a, [k]: e.target.value } : a,
                            ),
                          )
                        }
                      />
                    </label>
                  ))}
                  <button
                    className="icon-button"
                    aria-label={`Remove ${v.label}`}
                    onClick={() =>
                      update(
                        "variables",
                        editing.variables.filter((_, j) => j !== i),
                      )
                    }
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <div className="editor-section-heading">
                <h3>Process steps</h3>
                <button
                  className="text-link"
                  onClick={() =>
                    update("steps", [
                      ...editing.steps,
                      { title: "", description: "", prompt: "" },
                    ])
                  }
                >
                  <Plus size={14} /> Add step
                </button>
              </div>
              {editing.steps.map((s, i) => (
                <div className="step-editor" key={i}>
                  <div className="step-editor-top">
                    <span>STEP {String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <button
                        className="icon-button"
                        aria-label={`Move step ${i + 1} up`}
                        disabled={i === 0}
                        onClick={() => moveStep(i, -1)}
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Move step ${i + 1} down`}
                        disabled={i === editing.steps.length - 1}
                        onClick={() => moveStep(i, 1)}
                      >
                        <ArrowDown size={15} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Remove step ${i + 1}`}
                        onClick={() =>
                          update(
                            "steps",
                            editing.steps.filter((_, j) => j !== i),
                          )
                        }
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                  {(["title", "description", "prompt"] as const).map((k) => (
                    <label key={k}>
                      {k === "prompt" ? "Copyable prompt (optional)" : k}
                      <textarea
                        rows={k === "title" ? 1 : 3}
                        value={s[k] || ""}
                        onChange={(e) =>
                          update(
                            "steps",
                            editing.steps.map((a, j) =>
                              i === j ? { ...a, [k]: e.target.value } : a,
                            ),
                          )
                        }
                      />
                    </label>
                  ))}
                </div>
              ))}
              <label>
                Article / newsletter text
                <span className="field-hint">
                  Separate paragraphs with a blank line.
                </span>
                <textarea
                  rows={9}
                  value={editing.body?.join("\n\n") || ""}
                  onChange={(e) => update("body", e.target.value.split("\n\n"))}
                />
              </label>
              <label>
                Tags, separated by commas
                <input
                  value={editing.tags.join(", ")}
                  onChange={(e) =>
                    update(
                      "tags",
                      e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    )
                  }
                />
              </label>
              <div className="form-columns">
                <label>
                  Publication date
                  <input
                    type="date"
                    value={editing.publishedAt}
                    onChange={(e) => update("publishedAt", e.target.value)}
                  />
                </label>
                <label>
                  Reading time (minutes)
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={editing.readMinutes}
                    onChange={(e) =>
                      update("readMinutes", Number(e.target.value))
                    }
                  />
                </label>
              </div>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={editing.featured}
                  onChange={(e) => update("featured", e.target.checked)}
                />{" "}
                Feature this resource on the hub
              </label>
            </div>
            <aside className="editor-sidebar">
              <h3>Images, in the right places.</h3>
              <p>
                Upload your Codex-generated assets, or use an existing public
                image URL. Each image has a clear job.
              </p>
              {(["cover", "inputImage", "outputImage"] as const).map(
                (field) => (
                  <div className="editor-media" key={field}>
                    <label>
                      {field === "cover"
                        ? "Card / article cover"
                        : field === "inputImage"
                          ? "Input reference (slider left)"
                          : "Output example (slider right)"}
                      <input
                        value={editing[field] || ""}
                        onChange={(e) => update(field, e.target.value)}
                        placeholder="/art/file.svg or https://…"
                      />
                    </label>
                    {editing[field] && (
                      <img src={editing[field]} alt={`${field} preview`} />
                    )}
                    <label className="button media-upload">
                      <ImagePlus size={15} /> Upload image
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => upload(e.target.files?.[0], field)}
                      />
                    </label>
                  </div>
                ),
              )}
              <div className="editor-publish">
                <button
                  className="button primary full-width"
                  disabled={busy}
                  onClick={() => save(true)}
                >
                  {busy ? (
                    <LoaderCircle size={16} className="spin" />
                  ) : (
                    <ArrowUpRight size={17} />
                  )}{" "}
                  {allowed
                    ? "Publish resource"
                    : "Export ready-to-publish JSON"}
                </button>
                <button
                  className="button full-width"
                  disabled={busy}
                  onClick={() => save(false)}
                >
                  <Save size={16} />{" "}
                  {allowed ? "Save as draft" : "Export draft JSON"}
                </button>
                <p>
                  Only authorized editors can publish. Public visitors can read
                  published content and use the prompts.
                </p>
              </div>
            </aside>
          </section>
        )}
      </main>
    </>
  );
}
