# AI Tech Origin — project guide

## Purpose and current status

AI Tech Origin is a mobile-first library of practical prompts, repeatable processes, image comparisons, and newsletter editions. The future product direction includes paid prompt diaries, AI influencer workflows, agent-building guides, and curated prompt bundles. Current resources are free; payment collection, purchase entitlements, paid downloads, and subscription billing are not implemented. Do not advertise or simulate a checkout before a real payment provider and server-side access checks exist.

Production: https://ai-tech-origin.vercel.app
Repository: https://github.com/ajitandroiddevelopment/ai-tech-origin
Admin: https://ai-tech-origin.vercel.app/admin
Agent onboarding: https://ai-tech-origin.vercel.app/agent-access

## Product and design

Use near-black night mode by default and a clean white day mode. Preserve a visitor's explicit saved theme choice. Use rounded Nunito Sans typography, clear buttons, restrained borders, and soft corners. Library and Newsletter are separate rounded buttons at the top. Desktop uses a sidebar; mobile uses bottom navigation. Avoid glass, prism, glow, decorative gradients, tiny text, and permanent reference posters. Cards expose Copy and Customize directly. Keep controls accessible with keyboard focus and touch targets of at least 44px where practical.

Content sections: Create & Design, Work & Research, Learn & Improve. Formats: prompt, guide, newsletter. The newsletter is The Origin Edit.

## Architecture

Next.js App Router, TypeScript, React, Supabase Postgres/Auth/Storage, Vercel hosting, and GitHub deployments from main. Versions are pinned in package.json and package-lock.json. Read the installed Next.js documentation before changing framework behavior.

- app/: page routes, HTTP APIs, shared layout and styles.
- components/hub.tsx, card.tsx: browse, filter, save, copy, customize entry points.
- components/detail.tsx: variables, local drafts, ordered process prompts, export, sharing.
- components/image-comparison.tsx: shared input/output slider used in the public detail page and admin preview; starts centered at 50%.
- components/admin.tsx: content management, drafts, publishing, image uploads, process order, newsletter paragraphs, import/export, visitor dashboard.
- components/admin-workspace.tsx: owner-controlled team access, agent keys, and personal password setup.
- components/studio-login.tsx: email/password admin sign-in, with email-link fallback for first login or recovery.
- lib/content.ts: reads published resources from the database; never restores unpublished resources from seed data.
- lib/http.ts: validates editor sessions and same-origin browser writes.
- content/library.json: original local starter catalog. Changing it alone does not change the production database.
- supabase/migrations/: ordered, tracked schema changes.
- scripts/publish-content.mjs: validates content and optionally imports through an authenticated editor session.

## Manual admin workflow

1. Open /admin. Sign in with the owner's verified email. On the first visit, choose the email-link option; set a personal password under My account. Never paste a password into chat or commit it to GitHub.
2. Choose New resource, select section/format, and enter title, unique lowercase hyphenated slug, collection, summary, and prompt.
3. Add customization variables such as {{subject}}; each variable needs a key, label, and default. Variables used in the prompt must be defined.
4. Add ordered process steps. Each step can contain a title, explanation, and its own copyable prompt. Reorder using the up/down controls.
5. Choose separate cover, input, and output images. Upload JPG, PNG, or WebP files up to 12 MB or use an HTTPS image URL. These site assets become public. Do not upload confidential reference images.
6. When both input and output are present, the public resource automatically receives a swipeable comparison, including on work/research guides. Preview it in the editor. No external image generation runs on the website.
7. Save as draft to keep it private; publish to make it public. For an already-published resource, Unpublish and save as draft removes it from public reading. Keep slugs stable after publication.
8. Use JSON export for a content backup; import validates 1–100 records under 1 MB. Store media separately. Review ownership and permissions before sharing any export.
9. Publish newsletter web editions using Newsletter issue format and paragraph text. The subscriber list can be exported by authorized editors; campaign delivery needs a separate email provider. Auth emails are not newsletter broadcasts.

## Owner and admin permissions

The private editor allowlist is the source of truth. Roles are checked against the currently verified Supabase user on every protected operation, not user-editable metadata. The owner can add/remove admins and issue/revoke agent keys. Additional admins manage content, uploads, subscribers, and visitor metrics; they cannot manage the owner or agent credentials. Removing an admin's allowlist entry immediately blocks new protected operations even if an old access token has not expired. Only already-downloaded data cannot be recalled.

The owner can optionally supply an initial password for a new admin account. Supabase stores authentication passwords, never the content tables. A new account must verify its email before it can publish. Existing accounts keep their password: adding admin access is not a password reset. Each signed-in admin can change their own password. The owner account cannot be removed through the team UI. Store the owner's actual email only in the private database, not this public guide.

## AI-agent connection window

The /agent-access page is the public onboarding window. The owner creates a key in Admin → AI agents. The raw key is shown once, kept only in the current UI response, and stored hashed in the database. It expires after 1, 7, 30, or 90 days and can be revoked immediately.

Permissions:

- draft: read content and create/edit unpublished drafts. Cannot publish, unpublish, or overwrite an existing published resource.
- publish: read and manage draft/published content. Use only for a trusted agent explicitly allowed to publish.
- Neither key type can access team administration, passwords, subscribers, analytics, or raw visitor events.

Use a private environment variable named ORIGIN_AGENT_KEY; do not put it in a URL, project guide, browser localStorage, logs, or repository. Send it as Authorization: Bearer <key> over HTTPS to /api/agent/content.

GET /api/agent/content returns {"items":[...]}, including drafts within the delegated scope.
POST /api/agent/content accepts one resource object or an array of 1–100 validated resources under 1 MB. The published boolean controls draft/public status subject to the key's permission. Successful writes return {"saved":number}. Requests are bounded to 300 operations per hour per key and recorded in the owner's activity view.

401: missing or malformed key. 403: expired/revoked key, inactive owner, or insufficient permission. 400: invalid content or request limit. Failed batches roll back together. Revoke keys when a project ends or credentials may have been exposed.

Use supplied public image URLs or version-reviewed public assets committed through GitHub. Agent keys currently manage content records, not binary media uploads. Upload new binary media through the signed-in Creator Studio, or use an authorized Supabase editor session. The separate /api/content editor API accepts a verified Supabase Bearer access token and supports content read/import; never give an agent the owner's password. Future media automation should use narrowly scoped signed upload grants, not a browser-exposed service key.

### Minimal resource example

```json
{
  "slug": "portrait-lighting-diary",
  "title": "Portrait lighting diary",
  "summary": "A repeatable workflow for consistent portrait lighting.",
  "category": "create",
  "kind": "prompt",
  "collection": "Portrait workflows",
  "model": "Your chosen image model",
  "cover": "/art/editorial.svg",
  "inputImage": "/art/product-input.svg",
  "outputImage": "/art/still-life.svg",
  "prompt": "Create a portrait of {{subject}} with soft window light.",
  "variables": [{"key":"subject","label":"Subject","default":"an original character"}],
  "steps": [{"title":"Prepare the reference","description":"Use an image you own or have permission to use."}],
  "tags": ["Portrait", "Lighting"],
  "featured": false,
  "published": false,
  "publishedAt": "2026-10-30",
  "readMinutes": 3,
  "body": []
}
```

The SVG images above are illustrative placeholders, not generated portrait results. Replace them with reviewed input/output images before publishing a real tutorial.

## Data and security

Supabase has published content plus editor-only drafts, account-owned saves, private newsletter subscribers, anonymous bounded visitor events, owner-only team/key records, and private access activity. Every exposed table has row-level security. Site media is public, with editor-only writes. Personal input references chosen by visitors stay local in their browser.

Only publishable Supabase keys belong in the browser. No service-role key is required for the current features. Privileged database helpers live in app_private with explicit EXECUTE grants; exposed RPC wrappers use SECURITY INVOKER. Do not add a broad anonymous policy to fix a permission error. Never authorize against user_metadata. Keep activity records free of tokens, passwords, prompt bodies, and subscriber exports.

Visitor numbers are browser activity estimates, not verified people. Localhost and admin browsing are excluded from the standard client visitor tracker. Newsletter signup does not send campaigns. Supabase's default email service has provider restrictions and rate limits; configure production SMTP before inviting arbitrary external admins or relying on unrestricted auth delivery.

## Development and release

On the owner's Mac, project/tools live on New Volume via the APFS image mounted at /Volumes/CodexTools. Source /Volumes/New Volume/Codex/Tools/environment.sh before using the bundled Node runtime. Keep caches and captures in ignored work/.

Commands: npm ci; npm run dev; npm run typecheck; npm test; npm run build. Run meaningful auth/permission and content tests, then verify 390px mobile and 1440px desktop, no overflow, save/copy persistence, theme choice, keyboard use, comparison slider, and admin error handling. Never use production subscribers or actual customer purchases as test fixtures. Roll back database verification fixtures in the same transaction.

Vercel deploys main from the verified AI Tech Origin repository. Production is intentionally public; app-level owner/admin controls stay enforced. Public release authorization already covers this website, not unrelated services. Check the exact deployment commit and readiness after pushing. Do not alter another project or organization.

NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_SITE_URL are configured in deployment environment settings; keep local .env.local ignored. Maintain .env.example without actual secrets.

## Scaling plan

1. Stable content operations: owner/admin roles, drafts, media comparison, agent review, backups.
2. Content organization: richer collections, prompt diaries, ordered modules, models and versions, search.
3. Commerce: choose a real payment provider; add products, prices, currencies, immutable order lines, webhook signature checks, idempotent fulfillment, refunds, and server-checked entitlements. Keep paid prompt text out of public page payloads, static JSON, public storage, and preview endpoints.
4. Delivery: transactional email and newsletter provider, domain authentication, unsubscribe/suppression handling, rate limits, and deliverability checks.
5. Operations: restore drills, audit retention, error tracking, indexes, media transforms, accessibility/performance budgets, and stronger admin authentication as audience and revenue grow.

Keep roadmap features clearly separate from working functionality. Discuss payment-provider accounts, billing, and concrete spending before enabling them.
