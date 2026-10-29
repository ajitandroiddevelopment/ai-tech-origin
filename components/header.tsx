"use client";
import Link from "next/link";
import { useApp } from "./providers";
import {
  ArrowUpRight,
  Bookmark,
  Compass,
  Grid2X2,
  Mail,
  Moon,
  Sun,
  UserRound,
} from "lucide-react";
export function Header({
  view = "hub",
  onView,
}: {
  view?: string;
  onView?: (v: string) => void;
}) {
  const { theme, toggleTheme, saved, session, signIn } = useApp();
  return (
    <>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="AI Tech Origin home">
          <span className="brand-image" />
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link
            className={view === "hub" ? "active" : ""}
            href="/"
            onClick={(e) => {
              if (onView) {
                e.preventDefault();
                onView("hub");
              }
            }}
          >
            The Hub
          </Link>
          <Link
            className={view === "newsletter" ? "active" : ""}
            href="/newsletter"
            onClick={(e) => {
              if (onView) {
                e.preventDefault();
                onView("newsletter");
              }
            }}
          >
            Newsletter <ArrowUpRight size={12} />
          </Link>
          <Link
            href="/#saved"
            className={view === "saved" ? "active" : ""}
            onClick={(e) => {
              if (onView) {
                e.preventDefault();
                onView("saved");
              }
            }}
          >
            Saved{" "}
            <span className="nav-count">
              {saved.length.toString().padStart(2, "0")}
            </span>
          </Link>
        </nav>
        <div className="header-actions">
          <button
            className="icon-button theme-switch"
            onClick={toggleTheme}
            aria-label={
              theme === "dark" ? "Switch to day mode" : "Switch to night mode"
            }
          >
            {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <button
            className="icon-button account-button"
            aria-label={session ? "Account signed in" : "Sign in to sync saves"}
            onClick={signIn}
          >
            <UserRound size={19} />
          </button>
          <Link className="button small header-explore" href="/#library">
            Explore the library <ArrowUpRight size={15} />
          </Link>
        </div>
      </header>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {[
          { id: "hub", label: "Hub", Icon: Compass, href: "/" },
          { id: "library", label: "Library", Icon: Grid2X2, href: "/#library" },
          {
            id: "newsletter",
            label: "Newsletter",
            Icon: Mail,
            href: "/newsletter",
          },
          { id: "saved", label: "Saved", Icon: Bookmark, href: "/#saved" },
        ].map(({ id, label, Icon, href }) => (
          <Link
            key={id}
            href={href}
            className={view === id ? "active" : ""}
            onClick={(e) => {
              if (onView) {
                e.preventDefault();
                onView(id);
              }
            }}
          >
            <Icon size={21} />
            <span>{label}</span>
            {id === "saved" && saved.length > 0 && <i>{saved.length}</i>}
          </Link>
        ))}
      </nav>
    </>
  );
}
