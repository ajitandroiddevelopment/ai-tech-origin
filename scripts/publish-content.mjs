import fs from "node:fs/promises";
import { validateContent } from "../lib/validation.mjs";
const file = process.argv[2];
if (!file) {
  console.error("Usage: npm run publish:content -- path/to/content.json");
  process.exit(1);
}
const raw = JSON.parse(await fs.readFile(file, "utf8"));
const items = (Array.isArray(raw) ? raw : [raw]).map(validateContent);
const base = process.env.ORIGIN_SITE_URL;
const agentKey = process.env.ORIGIN_AGENT_KEY;
const token = agentKey || process.env.ORIGIN_EDITOR_ACCESS_TOKEN;
if (!base || !token) {
  console.log(
    `Validated ${items.length} resource(s). Set ORIGIN_SITE_URL and ORIGIN_AGENT_KEY (or ORIGIN_EDITOR_ACCESS_TOKEN) to publish, or import this JSON in Creator Studio.`,
  );
  process.exit(0);
}
const response = await fetch(
  new URL(agentKey ? "/api/agent/content" : "/api/content", base),
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(items),
  },
);
if (!response.ok) {
  console.error("Publishing failed:", response.status);
  process.exit(1);
}
console.log(`Saved ${items.length} resource(s).`);
