import { copyFile } from "node:fs/promises";
await copyFile(
  new URL("../PROJECT.md", import.meta.url),
  new URL("../public/PROJECT.md", import.meta.url),
);
