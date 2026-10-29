"use client";
import Link from "next/link";
import { SiteImage } from "./site-image";
import { ArrowUpRight, Bookmark, BookOpen, ArrowRight } from "lucide-react";
import type { Content } from "@/lib/types";
import { useApp } from "./providers";
export function Card({
  item,
  compact = false,
}: {
  item: Content;
  compact?: boolean;
}) {
  const { saved, toggleSave } = useApp();
  const isSaved = saved.some((x) => x.slug === item.slug);
  const href = `/${item.kind === "newsletter" ? "newsletter" : "prompt"}/${item.slug}`;
  return (
    <article className={`resource-card ${compact ? "compact" : ""}`}>
      <Link href={href} className="card-art" aria-label={`Open ${item.title}`}>
        <SiteImage src={item.cover} alt={item.title} />
        <span className="image-stamp">
          {item.kind === "guide"
            ? "FIELD GUIDE"
            : item.kind === "newsletter"
              ? "THE ORIGIN EDIT"
              : "PROMPT STUDY"}
        </span>
        <span className="card-open">
          <ArrowUpRight size={21} />
        </span>
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
            <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
          </button>
        </div>
        <h3>
          <Link href={href}>{item.title}</Link>
        </h3>
        <p>{item.summary}</p>
        <div className="card-footer">
          <span>
            {item.kind === "guide" ? <BookOpen size={13} /> : null}
            {item.kind === "guide"
              ? `${item.steps.length} steps`
              : item.kind === "newsletter"
                ? `${item.readMinutes} min read`
                : "Customize & copy"}
          </span>
          <Link href={href} aria-label={`Read ${item.title}`}>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </article>
  );
}
