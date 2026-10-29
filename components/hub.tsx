"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Search,
  X,
  Grid2X2,
  List,
  Bookmark,
  Clock3,
  BookOpen,
} from "lucide-react";
import type { Content } from "@/lib/types";
import { categories } from "@/lib/types";
import { Header } from "./header";
import { Card } from "./card";
import { Subscribe } from "./subscribe";
import { useApp } from "./providers";
export function Hub({
  items,
  initialView = "hub",
}: {
  items: Content[];
  initialView?: string;
}) {
  const [view, setView] = useState(initialView);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");
  const [layout, setLayout] = useState("grid");
  const [sort, setSort] = useState("latest");
  const { saved, recent } = useApp();
  const library = useRef<HTMLElement>(null);
  useEffect(() => {
    if (location.hash === "#saved") setView("saved");
    const shortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        library.current?.scrollIntoView();
        document
          .querySelector<HTMLInputElement>(
            '[aria-label="Search the resource library"]',
          )
          ?.focus();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  function navigate(v: string) {
    setView(v);
    setSearch("");
    setCategory("all");
    setKind("all");
    if (v === "library") {
      setTimeout(
        () => library.current?.scrollIntoView({ behavior: "smooth" }),
        0,
      );
    } else window.scrollTo({ top: 0, behavior: "smooth" });
    history.replaceState(
      null,
      "",
      v === "newsletter" ? "/newsletter" : v === "saved" ? "/#saved" : "/",
    );
  }
  const resources = items.filter((x) => x.kind !== "newsletter");
  const issues = items.filter((x) => x.kind === "newsletter");
  const filtered = resources
    .filter(
      (x) =>
        (view !== "saved" || saved.some((s) => s.slug === x.slug)) &&
        (view !== "recent" || recent.some((r) => r.slug === x.slug)) &&
        (category === "all" || x.category === category) &&
        (kind === "all" || x.kind === kind) &&
        `${x.title} ${x.summary} ${x.collection} ${x.tags.join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "az"
        ? a.title.localeCompare(b.title)
        : sort === "saved"
          ? (saved.find((s) => s.slug === b.slug)?.at || "").localeCompare(
              saved.find((s) => s.slug === a.slug)?.at || "",
            )
          : b.publishedAt.localeCompare(a.publishedAt),
    );

  return (
    <>
      <Header view={view} onView={navigate} />
      <div className="workspace-layout">
        <aside className="library-sidebar" aria-label="Library navigation">
          <p className="sidebar-title">Your workspace</p>
          {[
            { id: "hub", label: "All prompts", Icon: Grid2X2 },
            { id: "saved", label: "Saved", Icon: Bookmark },
            { id: "recent", label: "Recently copied", Icon: Clock3 },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              className={view === id ? "active" : ""}
              onClick={() => {
                setCategory("all");
                navigate(id);
              }}
            >
              <Icon size={20} />
              {label}
              {id === "saved" && <span>{saved.length}</span>}
            </button>
          ))}
          <p className="sidebar-title">Explore by purpose</p>
          {categories
            .filter((c) => c.id !== "all")
            .map((c) => (
              <button
                key={c.id}
                className={
                  category === c.id && view !== "newsletter" ? "active" : ""
                }
                onClick={() => {
                  navigate("hub");
                  setCategory(c.id);
                }}
              >
                {c.label}
              </button>
            ))}
          <div className="sidebar-note">
            <BookOpen size={25} />
            <h3>
              A starting point.
              <br />
              Make it yours.
            </h3>
            <p>Copy a prompt or open the full process to customize it.</p>
          </div>
          <Link className="studio-link" href="/admin">
            Creator studio
          </Link>
        </aside>
        <main className="site-main">
          {view === "newsletter" ? (
            <>
              <section className="newsletter-hero">
                <h1>The Origin Edit.</h1>
                <p>
                  A little signal in all the noise.
                  <br />
                  Practical prompts, considered ideas, and discoveries worth
                  your time.
                </p>
                <div className="newsletter-signup">
                  <Subscribe />
                </div>
              </section>
              <section className="archive-section">
                <div className="section-heading">
                  <div>
                    <h2>Read the latest</h2>
                  </div>
                  <span>
                    {issues.length} {issues.length === 1 ? "issue" : "issues"}{" "}
                    to explore
                  </span>
                </div>
                <div className="issue-list">
                  {issues.map((item, i) => (
                    <Link
                      key={item.slug}
                      href={`/newsletter/${item.slug}`}
                      className="issue-row"
                    >
                      <span className="issue-number">
                        {String(issues.length - i).padStart(3, "0")}
                      </span>
                      <img src={item.cover} alt="" />
                      <div>
                        <p className="card-meta">
                          {new Date(
                            item.publishedAt + "T00:00:00",
                          ).toLocaleDateString("en", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}{" "}
                          <span> / {item.readMinutes} MIN READ</span>
                        </p>
                        <h3>{item.title}</h3>
                        <p>{item.summary}</p>
                      </div>
                      <span className="issue-read">Read issue</span>
                    </Link>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <>
              <section className="library-section" ref={library} id="library">
                <div className="library-intro">
                  <div>
                    <h1>
                      {view === "saved"
                        ? "Your saved prompts"
                        : view === "recent"
                          ? "Recently copied"
                          : "A good idea starts here."}
                    </h1>
                    <p>
                      {view === "saved"
                        ? "Everything you want to come back to."
                        : view === "recent"
                          ? "Pick up where you left off."
                          : "Prompts and practical guides. Find one, make it yours."}
                    </p>
                  </div>
                </div>
                <div className="library-filter">
                  <div
                    className="category-tabs"
                    role="tablist"
                    aria-label="Resource category"
                  >
                    {categories.map((c) => (
                      <button
                        role="tab"
                        aria-selected={category === c.id}
                        key={c.id}
                        onClick={() => setCategory(c.id)}
                      >
                        {c.label}
                        {category === c.id && (
                          <span>
                            {
                              resources.filter(
                                (x) => c.id === "all" || x.category === c.id,
                              ).length
                            }
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="search-row">
                    <div className="search-box">
                      <Search size={18} />
                      <input
                        aria-label="Search the resource library"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search prompts and guides"
                      />
                      {search && (
                        <button
                          className="icon-button"
                          aria-label="Clear search"
                          onClick={() => setSearch("")}
                        >
                          <X size={16} />
                        </button>
                      )}
                      <span className="search-key">⌘ K</span>
                    </div>
                    <select
                      aria-label="Resource type"
                      value={kind}
                      onChange={(e) => setKind(e.target.value)}
                    >
                      <option value="all">All formats</option>
                      <option value="prompt">Prompts</option>
                      <option value="guide">Step-by-step guides</option>
                    </select>
                  </div>
                </div>
                <div className="results-bar">
                  <span>
                    {filtered.length}{" "}
                    {filtered.length === 1 ? "resource" : "resources"}
                    {view === "saved" ? " saved" : ""}
                  </span>
                  <div>
                    <button
                      className="mobile-recent"
                      onClick={() =>
                        navigate(view === "recent" ? "hub" : "recent")
                      }
                    >
                      {view === "recent" ? "All" : "Recent"}
                    </button>
                    <label className="sort-label">
                      Sort by{" "}
                      <select
                        aria-label="Sort resources"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                      >
                        <option value="latest">Latest added</option>
                        <option value="az">Name A–Z</option>
                        {view === "saved" && (
                          <option value="saved">Recently saved</option>
                        )}
                      </select>
                    </label>
                    <div className="view-toggle">
                      <button
                        className={layout === "grid" ? "active" : ""}
                        aria-label="Grid view"
                        onClick={() => setLayout("grid")}
                      >
                        <Grid2X2 size={17} />
                      </button>
                      <button
                        className={layout === "list" ? "active" : ""}
                        aria-label="List view"
                        onClick={() => setLayout("list")}
                      >
                        <List size={18} />
                      </button>
                    </div>
                  </div>
                </div>
                {filtered.length ? (
                  <div
                    className={`resource-grid ${layout === "list" ? "list-view" : ""}`}
                  >
                    {filtered.map((item) => (
                      <Card key={item.slug} item={item} />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <Bookmark size={32} />
                    <h3>
                      {view === "saved"
                        ? "Your next good find belongs here."
                        : "No resources match that search."}
                    </h3>
                    <p>
                      {view === "saved"
                        ? "Tap the bookmark on a resource to keep it for later. Saves work immediately on this device."
                        : "Try a different phrase or choose another category."}
                    </p>
                    <button
                      className="button"
                      onClick={() => {
                        setSearch("");
                        setCategory("all");
                        setKind("all");
                        if (view === "saved") navigate("hub");
                      }}
                    >
                      Explore the library <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </section>
            </>
          )}
          <section className="footer-newsletter">
            <div>
              <h2>
                Keep a little curiosity
                <br />
                in your inbox.
              </h2>
              <p>Practical ideas from The Origin Edit.</p>
            </div>
            <Subscribe />
          </section>
          <footer className="site-footer">
            <Link className="footer-brand" href="/">
              AI TECH ORIGIN<span>Ideas into action.</span>
            </Link>
            <div>
              <Link href="/newsletter">Newsletter</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/admin">Creator studio</Link>
            </div>
            <span>© {new Date().getFullYear()} AI Tech Origin</span>
          </footer>
        </main>
      </div>
    </>
  );
}
