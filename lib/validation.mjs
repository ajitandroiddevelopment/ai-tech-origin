const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const clean = (value, name, max = 1000, required = false) => {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (required && !value.trim())
  )
    throw new Error(`Invalid ${name}`);
  return value.trim();
};
function image(value) {
  if (!value) return undefined;
  const url = clean(value, "image URL", 2000, true);
  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\"))
    return url;
  if (/^https:\/\//.test(url)) {
    const u = new URL(url);
    if (!u.username && !u.password) return url;
  }
  throw new Error("Images must use a local asset path or HTTPS URL");
}
export function validateContent(data) {
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new Error("Content must be an object");
  const slug = clean(data.slug, "slug", 100, true);
  if (!SLUG.test(slug)) throw new Error("Use a lowercase, hyphenated slug");
  if (!["create", "work", "learn"].includes(data.category))
    throw new Error("Choose a category");
  if (!["prompt", "guide", "newsletter"].includes(data.kind))
    throw new Error("Choose a content format");
  if (!Array.isArray(data.variables) || data.variables.length > 20)
    throw new Error("At most 20 variables");
  if (!Array.isArray(data.steps) || data.steps.length > 30)
    throw new Error("At most 30 steps");
  if (!Array.isArray(data.tags) || data.tags.length > 20)
    throw new Error("At most 20 tags");
  const variables = data.variables.map((v) => {
    const key = clean(v.key, "variable key", 50, true);
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key))
      throw new Error("Invalid variable key");
    return {
      key,
      label: clean(v.label, "variable label", 100, true),
      default: clean(v.default, "default value", 2000),
    };
  });
  if (new Set(variables.map((v) => v.key)).size !== variables.length)
    throw new Error("Variable keys must be unique");
  const publishedAt = clean(data.publishedAt, "publication date", 10, true);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(publishedAt) ||
    Number.isNaN(Date.parse(publishedAt))
  )
    throw new Error("Invalid publication date");
  return {
    slug,
    title: clean(data.title, "title", 200, true),
    summary: clean(data.summary, "summary", 1000, true),
    category: data.category,
    kind: data.kind,
    collection: clean(data.collection, "collection", 100, true),
    model: clean(data.model ?? "", "tool", 100),
    cover: image(data.cover) || "",
    inputImage: image(data.inputImage),
    outputImage: image(data.outputImage),
    prompt: clean(data.prompt ?? "", "prompt", 30000),
    variables,
    steps: data.steps.map((s) => ({
      title: clean(s.title, "step title", 200, true),
      description: clean(s.description, "step description", 8000),
      prompt: s.prompt ? clean(s.prompt, "step prompt", 30000) : undefined,
    })),
    tags: data.tags.map((t) => clean(t, "tag", 60, true)),
    featured: Boolean(data.featured),
    published: Boolean(data.published),
    publishedAt,
    readMinutes: Math.max(1, Math.min(120, Number(data.readMinutes) || 3)),
    body: Array.isArray(data.body)
      ? data.body.slice(0, 60).map((p) => clean(p, "paragraph", 20000))
      : [],
  };
}
export function validateEmail(value) {
  return (
    typeof value === "string" &&
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}
