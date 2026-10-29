# AI Tech Origin project instructions

Keep the original mobile-first editorial design: charcoal backgrounds, white text, neutral surfaces, no colored AI gradients, glowing controls, or green brand accents. Preserve a working day/night theme. Desktop navigation is at the top; phones use the fixed bottom navigation with safe-area spacing.

Keep code, assets, dependency caches, and research on New Volume. On the owner's Mac the APFS image mounts at /Volumes/CodexTools and this checkout is /Volumes/CodexTools/projects/ai-tech-origin. Do not reformat the external drive.

Content belongs to three sections: Create & Design, Work & Research, and Learn & Improve. The newsletter is The Origin Edit. Keep copy concise and useful. Do not invent readership counts, testimonials, generated results, news claims, or capabilities.

Use content/library.json for reviewed Git-based baseline content. Validate with npm test. Database records with matching slugs override baseline entries. Drafts must stay private. Never expose a service-role key, auth token, subscriber email list, or analytics records in public code or responses.

Reference inputs selected by visitors stay local. Creator Studio uploads are editor-only and become public site assets. The image comparison is a preview; generation takes place in Codex or the visitor's chosen external tool. Do not imply an external generation request happened when it did not.

Before releasing code run npm test and npm run build. For interaction changes verify the flow in a browser at 390px and 1440px, including keyboard focus, save/copy/draft persistence, and error feedback. Preserve the fixed mobile navigation and avoid horizontal overflow. Publish only to the verified repository and Vercel team in README.md.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
