"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { SiteImage } from "./site-image";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  X,
  SlidersHorizontal,
  Grid2X2,
  List,
  Bookmark,
  Clock3,
  Sparkle,
  Image as ImageIcon,
  MoveUpRight,
  BookOpen,
  FileText,
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
  const { saved, recent, signIn, session, signOut } = useApp();
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
  const featured = resources.find((x) => x.featured) || resources[0];
  return (
    <>
      <Header view={view} onView={navigate} />
      <main className="site-main">
        {view === "newsletter" ? (
          <>
            <section className="newsletter-hero">
              <div className="eyebrow">
                <span className="status-dot" /> LETTERS FOR CURIOUS MINDS
              </div>
              <h1>
                THE ORIGIN <em>EDIT.</em>
              </h1>
              <p>
                A little signal in all the noise.
                <br />
                Practical prompts, considered ideas, and discoveries worth your
                time.
              </p>
              <div className="newsletter-signup">
                <Subscribe />
              </div>
              <div className="newsletter-rule">
                <span>INDEPENDENT THINKING.</span>
                <span>STRAIGHT TO YOUR INBOX.</span>
              </div>
            </section>
            <section className="archive-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">GOOD IDEAS AGE WELL</p>
                  <h2>The archive.</h2>
                </div>
                <span>
                  {issues.length} {issues.length === 1 ? "issue" : "issues"} to
                  explore
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
                    <ArrowUpRight size={28} />
                  </Link>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            {view === "hub" && (
              <>
                <section className="hero">
                  <div className="hero-label">
                    <span className="status-dot" /> A RESOURCE LIBRARY FOR
                    CURIOUS MINDS{" "}
                    <span className="hero-edition">
                      A LITTLE CURIOSITY / EVERY DAY
                    </span>
                  </div>
                  <div className="hero-title-row">
                    <h1>
                      LESS SEARCHING.
                      <br />
                      <span>MORE CREATING.</span>
                    </h1>
                    <div className="hero-aside">
                      <p>
                        Good prompts. Better processes.
                        <br />
                        Ideas you’ll actually put to work.
                      </p>
                      <button
                        className="text-link"
                        onClick={() =>
                          library.current?.scrollIntoView({
                            behavior: "smooth",
                          })
                        }
                      >
                        Find your next idea <ArrowUpRight size={19} />
                      </button>
                    </div>
                  </div>
                  <div className="hero-bottom">
                    <span>CREATIVITY. CLARITY. A LITTLE CURIOSITY.</span>
                    <span>
                      SCROLL TO DISCOVER <ArrowRight size={13} />
                    </span>
                  </div>
                </section>
                <section className="featured-section">
                  <div className="featured-label">
                    <span>01 / IN THE SPOTLIGHT</span>
                    <span>SELECTED BY AI TECH ORIGIN</span>
                  </div>
                  <div className="featured-grid">
                    <Link
                      className="feature-image"
                      href={`/prompt/${featured.slug}`}
                    >
                      <SiteImage
                        priority
                        sizes="(max-width: 760px) 100vw, 65vw"
                        src={featured.cover}
                        alt="A cinematic space editorial shared by AI Tech Origin"
                      />
                      <div className="feature-topline">
                        <span>THE CREATIVE FILES</span>
                        <span>
                          01 — {String(resources.length).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="feature-caption">
                        <div>
                          <p>FEATURED PROMPT / CREATE & DESIGN</p>
                          <h2>
                            BIG IDEAS.
                            <br />
                            OTHER WORLDS.
                          </h2>
                        </div>
                        <span className="circle-arrow">
                          <ArrowUpRight size={30} />
                        </span>
                      </div>
                    </Link>
                    <aside className="feature-side">
                      <div className="edit-card">
                        <div className="edit-card-top">
                          <span>THE ORIGIN EDIT</span>
                          <MailMark />
                        </div>
                        <h2>
                          A LITTLE SIGNAL.
                          <br />
                          <span>
                            A LOT TO
                            <br />
                            THINK ABOUT.
                          </span>
                        </h2>
                        <p>
                          A short read for curious people.
                          <br />
                          Useful ideas, prompts, and discoveries.
                        </p>
                        <Subscribe compact />
                      </div>
                      <Link className="mini-feature" href="/prompt/focus-five">
                        <div>
                          <p className="eyebrow">ONE IDEA TO KEEP</p>
                          <h3>
                            Do less.
                            <br />
                            Mean more.
                          </h3>
                          <span>
                            The focus exercise <ArrowUpRight size={16} />
                          </span>
                        </div>
                        <span className="focus-number">
                          5<span>/25</span>
                        </span>
                      </Link>
                    </aside>
                  </div>
                </section>
              </>
            )}
            <section className="library-section" ref={library} id="library">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">
                    {view === "saved"
                      ? "YOUR PERSONAL COLLECTION"
                      : view === "recent"
                        ? "PICK UP WHERE YOU LEFT OFF"
                        : "MADE TO BE USED, NOT JUST SAVED"}
                  </p>
                  <h2>
                    {view === "saved"
                      ? "The good stuff. Kept."
                      : view === "recent"
                        ? "Recently copied."
                        : "Find your next starting point."}
                  </h2>
                </div>
                <div className="library-tools">
                  <button
                    className={
                      view === "recent" ? "text-link active" : "text-link"
                    }
                    onClick={() =>
                      navigate(view === "recent" ? "hub" : "recent")
                    }
                  >
                    <Clock3 size={15} /> Recently copied
                  </button>
                  {view === "saved" && (
                    <button
                      className="text-link"
                      onClick={session ? signOut : signIn}
                    >
                      {session ? "Sign out" : "Sync your saves"}{" "}
                      <ArrowUpRight size={15} />
                    </button>
                  )}
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
                      placeholder="A good idea starts with a search…"
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
                  {view === "saved" ? " saved for later" : " to make your own"}
                </span>
                <div>
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
            <p className="eyebrow">STAY CURIOUS</p>
            <h2>
              GOOD THINGS
              <br />
              ARE WORTH <em>SHARING.</em>
            </h2>
          </div>
          <div>
            <p>
              More useful ideas. Fewer open tabs.
              <br />
              Join The Origin Edit.
            </p>
            <Subscribe />
          </div>
        </section>
        <footer className="site-footer">
          <Link className="footer-brand" href="/">
            AI TECH ORIGIN<span>Ideas into action.</span>
          </Link>
          <div>
            <Link href="/newsletter">
              Newsletter <ArrowUpRight size={12} />
            </Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/admin">Creator studio</Link>
          </div>
          <span>© {new Date().getFullYear()} AI Tech Origin</span>
        </footer>
      </main>
    </>
  );
}
function MailMark() {
  return (
    <svg
      width="24"
      height="20"
      viewBox="0 0 24 20"
      fill="none"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="22" height="18" rx="2" stroke="currentColor" />
      <path d="m2 2 10 8L22 2" stroke="currentColor" />
    </svg>
  );
}
