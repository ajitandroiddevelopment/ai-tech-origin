import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validateContent, validateEmail } from "../lib/validation.mjs";
const content = JSON.parse(
  fs.readFileSync(new URL("../content/library.json", import.meta.url)),
);
test("starter catalog has valid unique slugs, complete variables and existing local assets", () => {
  const slugs = new Set();
  for (const item of content) {
    const result = validateContent(item);
    assert(!slugs.has(result.slug));
    slugs.add(result.slug);
    for (const img of [
      result.cover,
      result.inputImage,
      result.outputImage,
    ].filter(Boolean))
      if (img.startsWith("/"))
        assert(fs.existsSync(new URL("../public" + img, import.meta.url)));
    const text = [item.prompt, ...item.steps.map((s) => s.prompt)]
      .filter(Boolean)
      .join(" ");
    for (const key of [...text.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1]))
      assert(
        item.variables.some((v) => v.key === key),
        `${item.slug} is missing ${key}`,
      );
  }
});
test("reject executable URLs, traversal slugs, duplicate variables and oversized content", () => {
  const first = content[0];
  assert.throws(() =>
    validateContent({ ...first, cover: "javascript:alert(1)" }),
  );
  assert.throws(() =>
    validateContent({ ...first, cover: "//evil.test/image.png" }),
  );
  assert.throws(() => validateContent({ ...first, slug: "../../admin" }));
  assert.throws(() =>
    validateContent({
      ...first,
      variables: [first.variables[0], first.variables[0]],
    }),
  );
  assert.throws(() => validateContent({ ...first, prompt: "a".repeat(30001) }));
});
test("newsletter email validation rejects malformed and oversized addresses", () => {
  assert(validateEmail("reader@example.com"));
  for (const email of [
    "no-at",
    "a@b",
    "a b@c.com",
    "a@b.com\nBcc:x@y.z",
    "a".repeat(250) + "@b.com",
  ])
    assert(!validateEmail(email));
});
