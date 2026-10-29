"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  Copy,
  Download,
  RotateCcw,
  Share2,
  Upload,
  X,
} from "lucide-react";
import type { Content } from "@/lib/types";
import { Header } from "./header";
import { ImageComparison } from "./image-comparison";
import { Card } from "./card";
import { Subscribe } from "./subscribe";
import { trackEvent, useApp } from "./providers";
function interpolate(text: string, values: Record<string, string>) {
  return text.replace(
    /\{\{([^}]+)\}\}/g,
    (_, key) => values[key] || `[${key}]`,
  );
}
export function Detail({
  item,
  related,
}: {
  item: Content;
  related: Content[];
}) {
  const { saved, toggleSave, copied, toast } = useApp();
  const initial = Object.fromEntries(
    item.variables.map((x) => [x.key, x.default]),
  );
  const [values, setValues] = useState(initial);
  const [ratio, setRatio] = useState("4:5");
  const [compare, setCompare] = useState(50);
  const [input, setInput] = useState(item.inputImage || "");
  const [preview, setPreview] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const [stepCopied, setStepCopied] = useState<number | null>(null);
  const object = useRef<string | null>(null);
  const isSaved = saved.some((x) => x.slug === item.slug);
  useEffect(() => {
    try {
      const draft = JSON.parse(
        localStorage.getItem(`origin.draft.${item.slug}`) || "null",
      );
      if (draft) setValues({ ...initial, ...draft });
    } catch {}
    trackEvent("open", item.slug);
    return () => {
      if (object.current) URL.revokeObjectURL(object.current);
    };
  }, [item.slug]);
  function change(key: string, value: string) {
    const next = { ...values, [key]: value };
    setValues(next);
    try {
      localStorage.setItem(`origin.draft.${item.slug}`, JSON.stringify(next));
    } catch {}
  }
  const prompt = interpolate(item.prompt || "", values);
  async function copy(text = prompt, index?: number) {
    try {
      await navigator.clipboard.writeText(text);
      copied(item.slug);
      if (index === undefined) {
        setJustCopied(true);
        setTimeout(() => setJustCopied(false), 2000);
      } else {
        setStepCopied(index);
        setTimeout(() => setStepCopied(null), 2000);
      }
    } catch {
      toast(
        "Copy wasn’t available. Select the prompt text and copy it manually.",
      );
    }
  }
  async function share() {
    const data = { title: item.title, text: item.summary, url: location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(location.href);
        toast("Resource link copied");
      }
    } catch {}
  }
  function upload(file?: File) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 12 * 1024 * 1024
    ) {
      toast("Choose a JPG, PNG, or WebP image under 12 MB.");
      return;
    }
    if (object.current) URL.revokeObjectURL(object.current);
    object.current = URL.createObjectURL(file);
    setInput(object.current);
    setCompare(0);
    toast("Your reference is ready. It stays on this device.");
  }
  function download() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            title: item.title,
            prompt,
            variables: values,
            steps: item.steps.map((x) => ({
              ...x,
              prompt: x.prompt ? interpolate(x.prompt, values) : undefined,
            })),
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.slug}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <Header view={item.kind === "newsletter" ? "newsletter" : "hub"} />
      <main className="detail-main">
        <Link
          href={item.kind === "newsletter" ? "/newsletter" : "/#library"}
          className="back-link"
        >
          <ArrowLeft size={16} />{" "}
          {item.kind === "newsletter"
            ? "Back to the archive"
            : "Back to the library"}
        </Link>
        <div className="detail-heading">
          <p className="eyebrow">
            {item.collection.toUpperCase()} / {item.kind.toUpperCase()}
          </p>
          <h1>{item.title}</h1>
          <p>{item.summary}</p>
          <div className="detail-meta">
            <span>AI TECH ORIGIN</span>
            <span>{item.readMinutes} MIN READ</span>
            <span>{item.publishedAt}</span>
            <button className="text-link" onClick={share}>
              <Share2 size={15} /> Share
            </button>
          </div>
        </div>
        {item.kind === "newsletter" ? (
          <article className="newsletter-article">
            {item.inputImage && item.outputImage ? (
              <ImageComparison
                input={item.inputImage}
                output={item.outputImage}
                value={compare}
                onChange={setCompare}
                layout={item.outputImage.endsWith(".svg")}
              />
            ) : (
              <img
                className="article-cover"
                src={item.cover}
                alt={item.title}
              />
            )}
            {item.body?.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <div className="article-subscribe">
              <h2>Keep a little curiosity in your inbox.</h2>
              <Subscribe />
            </div>
          </article>
        ) : (
          <div className="detail-grid">
            <div className="detail-story">
              {item.category === "create" ||
              Boolean(item.inputImage && item.outputImage) ? (
                <>
                  <ImageComparison
                    input={input}
                    output={item.outputImage || item.cover}
                    value={compare}
                    onChange={setCompare}
                    ratio={
                      ratio === "4:5" ? "4/5" : ratio === "1:1" ? "1/1" : "16/9"
                    }
                    layout={(item.outputImage || item.cover).endsWith(".svg")}
                  />
                  <div className="comparison-caption">
                    <span>Drag to compare input and output</span>
                    <select
                      aria-label="Image preview aspect ratio"
                      value={ratio}
                      onChange={(e) => setRatio(e.target.value)}
                    >
                      <option>4:5</option>
                      <option>1:1</option>
                      <option>16:9</option>
                    </select>
                  </div>
                  <label
                    className="upload-reference"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      upload(e.dataTransfer.files[0]);
                    }}
                  >
                    <Upload size={23} />
                    <strong>Bring your own starting point.</strong>
                    <span>Drop a reference, or browse your files</span>
                    <small>JPG, PNG, WEBP · UP TO 12 MB</small>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => upload(e.target.files?.[0])}
                    />
                  </label>
                  <p className="privacy-caption">
                    Your reference stays on this device. Copy the prompt and
                    attach your image in your image tool. This preview compares
                    images; it does not generate a new output.
                  </p>
                </>
              ) : item.slug === "focus-five" ? (
                <div className="guide-summary">
                  <h2>The 5/25 Rule</h2>
                  <p>Choose five priorities. Give them your full attention.</p>
                </div>
              ) : (
                <img
                  className="guide-cover"
                  src={item.cover}
                  alt={item.title}
                />
              )}
              <section className="process-section">
                <p className="eyebrow">THE PROCESS</p>
                <h2>
                  {item.kind === "guide"
                    ? "The process. Step by step."
                    : "How to make it yours."}
                </h2>
                {item.steps.map((step, i) => (
                  <article className="process-step" key={i}>
                    <span className="step-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                      {step.prompt && (
                        <div className="step-prompt">
                          <div>
                            <span>PROMPT {i + 1}</span>
                            <button
                              className="text-link"
                              onClick={() =>
                                copy(interpolate(step.prompt!, values), i)
                              }
                            >
                              {stepCopied === i ? (
                                <Check size={15} />
                              ) : (
                                <Copy size={15} />
                              )}{" "}
                              {stepCopied === i ? "Copied" : "Copy prompt"}
                            </button>
                          </div>
                          <p>{interpolate(step.prompt, values)}</p>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
                {!item.steps.length && (
                  <p>
                    Personalize the fields, copy the finished prompt, and use it
                    with your preferred tool. Review the first result and refine
                    one detail at a time.
                  </p>
                )}
                {item.body?.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </section>
            </div>
            <aside className="customizer" id="customize">
              <div className="customizer-top">
                <span className="eyebrow">CUSTOMIZE</span>
                <span className="draft-indicator">Auto-saved</span>
              </div>
              <h2>Customize prompt</h2>
              <p className="customizer-description">
                A useful starting point. A few personal touches.
              </p>
              <div className="detail-tags">
                {item.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              {item.variables.map((variable) => (
                <label className="variable-field" key={variable.key}>
                  <span>{variable.label}</span>
                  <input
                    value={values[variable.key] || ""}
                    onChange={(e) => change(variable.key, e.target.value)}
                    placeholder={variable.default}
                  />
                </label>
              ))}
              {item.prompt && (
                <>
                  <div className="prompt-preview-label">
                    <span>Your prompt</span>
                    <span>{prompt.length} CHARACTERS</span>
                  </div>
                  <div className="prompt-preview" tabIndex={0}>
                    {prompt}
                  </div>
                  <button
                    className="button primary full-width copy-prompt"
                    onClick={() => copy()}
                  >
                    {justCopied ? <Check size={18} /> : <Copy size={18} />}{" "}
                    {justCopied ? "Copied to clipboard" : "Copy prompt"}
                  </button>
                </>
              )}
              <button
                className={`button full-width ${isSaved ? "saved-state" : ""}`}
                onClick={() => toggleSave(item.slug)}
              >
                <Bookmark size={17} fill={isSaved ? "currentColor" : "none"} />
                {isSaved ? "Saved to your library" : "Save prompt"}
              </button>
              <div className="customizer-bottom">
                <button
                  className="text-link"
                  onClick={() => {
                    setValues(initial);
                    localStorage.removeItem(`origin.draft.${item.slug}`);
                    toast("Original prompt restored");
                  }}
                >
                  <RotateCcw size={14} /> Reset
                </button>
                <button className="text-link" onClick={download}>
                  <Download size={14} /> Export
                </button>
                <button className="text-link" onClick={share}>
                  <Share2 size={14} /> Share
                </button>
              </div>
              <p className="tool-note">
                {item.model} · Copy-ready instructions
              </p>
            </aside>
          </div>
        )}
        {related.length > 0 && (
          <section className="related-section">
            <div className="section-heading">
              <h2>Keep the ideas coming.</h2>
              <Link href="/#library" className="text-link">
                Explore the library <ArrowRight size={16} />
              </Link>
            </div>
            <div className="resource-grid">
              {related.map((x) => (
                <Card key={x.slug} item={x} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
