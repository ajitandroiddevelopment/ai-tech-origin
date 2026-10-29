"use client";
import { useState } from "react";
import Link from "next/link";
import { SiteImage } from "./site-image";
import {
  Bookmark,
  Copy,
  Check,
  SlidersHorizontal,
  BookOpen,
} from "lucide-react";
import type { Content } from "@/lib/types";
import { useApp } from "./providers";
export function Card({
  item,
  compact = false,
}: {
  item: Content;
  compact?: boolean;
}) {
  const { saved, toggleSave, copied, toast } = useApp();
  const [done, setDone] = useState(false);
  const isSaved = saved.some((x) => x.slug === item.slug);
  const href = `/${item.kind === "newsletter" ? "newsletter" : "prompt"}/${item.slug}`;
  async function copyPrompt() {
    const defaults = Object.fromEntries(
      item.variables.map((v) => [v.key, v.default]),
    );
    let values = defaults;
    try {
      values = {
        ...defaults,
        ...JSON.parse(
          localStorage.getItem(`origin.draft.${item.slug}`) || "{}",
        ),
      };
    } catch {}
    const interpolate = (t: string) =>
      t.replace(/\{\{([^}]+)\}\}/g, (_, key) => values[key] || `[${key}]`);
    const text = item.prompt
      ? interpolate(item.prompt)
      : item.steps
          .map(
            (s, i) =>
              `${i + 1}. ${s.title}\n${s.description}${s.prompt ? "\n" + interpolate(s.prompt) : ""}`,
          )
          .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      copied(item.slug);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      toast("Open the details to select and copy the prompt.");
    }
  }
  const retired =
    (item.slug === "cinematic-worlds" && item.cover === "/art/editorial.svg") ||
    (item.slug === "focus-five" && item.cover === "/art/learning.svg");
  return (
    <article
      className={`resource-card ${compact ? "compact" : ""} ${retired ? "text-cover-card" : ""}`}
    >
      <Link href={href} className="card-art" aria-label={`Open ${item.title}`}>
        {retired ? (
          <div className="typographic-cover">
            <span>{item.collection}</span>
            <strong>
              {item.slug === "focus-five" ? (
                <>
                  Fewer goals.
                  <br />
                  More focus.
                </>
              ) : (
                <>
                  Imagine it.
                  <br />
                  Create it.
                </>
              )}
            </strong>
            <span>
              {item.kind === "guide"
                ? "Step-by-step guide"
                : "Customizable prompt"}
            </span>
          </div>
        ) : (
          <SiteImage src={item.cover} alt={item.title} />
        )}
      </Link>
      <div className="card-content">
        <div className="card-meta">
          <span>{item.collection}</span>
          <button
            className={`save-button ${isSaved ? "is-saved" : ""}`}
            aria-label={`${isSaved ? "Unsave" : "Save"} ${item.title}`}
            aria-pressed={isSaved}
            onClick={() => toggleSave(item.slug)}
          >
            <Bookmark size={20} fill={isSaved ? "currentColor" : "none"} />
          </button>
        </div>
        <h3>
          <Link href={href}>{item.title}</Link>
        </h3>
        <p>{item.summary}</p>
        <div className="card-actions">
          {item.kind !== "newsletter" ? (
            <>
              <button
                className="button card-copy"
                onClick={copyPrompt}
                aria-label={`Copy ${item.kind === "guide" ? "process" : "prompt"}: ${item.title}`}
              >
                {done ? <Check size={17} /> : <Copy size={17} />}{" "}
                {done
                  ? "Copied"
                  : item.kind === "guide"
                    ? "Copy process"
                    : "Copy prompt"}
              </button>
              <Link
                className="button secondary card-customize"
                href={href + "#customize"}
              >
                <SlidersHorizontal size={17} /> Customize
              </Link>
            </>
          ) : (
            <Link className="button" href={href}>
              <BookOpen size={17} /> Read issue
            </Link>
          )}
        </div>
        <Link href={href} className="card-detail-link">
          {item.kind === "guide" ? "View the full process" : "View details"}
        </Link>
      </div>
    </article>
  );
}
