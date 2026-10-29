"use client";
import Link from "next/link";
import { useApp } from "./providers";
import { Bookmark, Grid2X2, Mail, Moon, Sun, UserRound } from "lucide-react";
export function Header({
  view = "hub",
  onView,
}: {
  view?: string;
  onView?: (v: string) => void;
}) {
  const { theme, toggleTheme, saved, session, signIn } = useApp();
  const tabs = [
    { id: "hub", label: "Prompt library", href: "/", Icon: Grid2X2 },
    { id: "newsletter", label: "Newsletter", href: "/newsletter", Icon: Mail },
  ];
  return (
    <>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="AI Tech Origin home">
          <span className="brand-image" />
        </Link>
        <nav className="mode-switch" aria-label="Main navigation">
          {tabs.map(({ id, label, href, Icon }) => (
            <Link
              key={id}
              href={href}
              className={
                (id === "hub" ? view !== "newsletter" : view === "newsletter")
                  ? "active"
                  : ""
              }
              aria-current={
                (id === "hub" ? view !== "newsletter" : view === "newsletter")
                  ? "page"
                  : undefined
              }
              onClick={(e) => {
                if (onView) {
                  e.preventDefault();
                  onView(id);
                }
              }}
            >
              <Icon size={19} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="icon-button theme-switch"
            onClick={toggleTheme}
            aria-label={
              theme === "dark" ? "Switch to day mode" : "Switch to night mode"
            }
          >
            {theme === "dark" ? <Sun size={21} /> : <Moon size={21} />}
          </button>
          <button
            className="icon-button account-button"
            aria-label={session ? "Account signed in" : "Sign in to sync saves"}
            onClick={signIn}
          >
            <UserRound size={21} />
          </button>
        </div>
      </header>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {[
          { id: "hub", label: "Library", href: "/", Icon: Grid2X2 },
          {
            id: "newsletter",
            label: "Newsletter",
            href: "/newsletter",
            Icon: Mail,
          },
          { id: "saved", label: "Saved", href: "/#saved", Icon: Bookmark },
        ].map(({ id, label, href, Icon }) => (
          <Link
            key={id}
            href={href}
            className={
              view === id || (id === "hub" && view === "library")
                ? "active"
                : ""
            }
            onClick={(e) => {
              if (onView) {
                e.preventDefault();
                onView(id);
              }
            }}
          >
            <Icon size={23} />
            <span>{label}</span>
            {id === "saved" && saved.length > 0 && <i>{saved.length}</i>}
          </Link>
        ))}
      </nav>
    </>
  );
}
