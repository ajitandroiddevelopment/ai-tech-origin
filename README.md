# AI Tech Origin

A mobile-first resource library for creative prompts, practical research, learning guides, and The Origin Edit newsletter. Original charcoal-and-white interface with a day/night switch.

## Run locally

Use Node.js 24.22.1 or later. Copy `.env.example` to `.env.local` and enter your Supabase project URL and publishable key. These are public client credentials. Never put a service-role or secret key in a `NEXT_PUBLIC_` variable.

```sh
npm ci
npm run dev
npm test
npm run build
```

On Ajit's Mac, source `/Volumes/New Volume/Codex/Tools/environment.sh` first. The working project is `/Volumes/CodexTools/projects/ai-tech-origin`, inside the APFS disk image physically stored on New Volume.

## Visitor journeys

- Browse and search Create & Design, Work & Research, and Learn & Improve.
- Filter prompts or guides, switch grid/list views, and sort results.
- Save resources immediately on the current device; sign in to sync saves across devices.
- Customize prompt variables with browser-local autosaved drafts; copy, reset, export, or share.
- Follow ordered process cards with separate copy buttons. Recent tracks copied prompts.
- Compare input/output images with the slider: slide left for input, right for output. Select or drop a personal input image for a local preview. The website does not itself generate images.
- Read newsletter issues and join the subscriber list.

## Publish and manage content

Visit `/admin` (Creator Studio). It offers image uploads, category and format selection, prompt variables, ordered process steps, newsletter paragraphs, drafts, publishing, JSON import/export, and visitor statistics.

The bundled catalog in `content/library.json` contains original starter content for local previews and initial import. When Supabase is configured, the database is the source of truth. Publishing changes a database record immediately; unpublished drafts are never replaced by a public starter copy. A database outage shows a retry page rather than silently republishing old content.

The owner email is configured in the private `app_private.editor_emails` table. The owner allowlist is configured privately in the database, rather than committed to this repository. Owner sign-in requires a verified Supabase email. Other accounts cannot publish, view subscriber emails, read analytics, or upload site media. Change the allowlist only through an authorized database connection.

### Working with Codex

Tell Codex the resource title, section, prompt, customizable fields, process steps, and input/output images. It can:

1. Add images under `public/`, update and validate `content/library.json`, and commit to GitHub. Import the updated JSON into the live database through Creator Studio or the authorized Supabase connection.
2. Import validated JSON in Creator Studio, or use the connected Supabase tools to upsert the content record.
3. Validate a JSON file with `npm run publish:content -- path/to/file.json`. Optional authenticated API publishing uses `ORIGIN_SITE_URL` and `ORIGIN_EDITOR_ACCESS_TOKEN` in the shell environment; do not commit tokens.

Upload site media through Creator Studio to the `origin-media` bucket. Reference images selected by ordinary visitors are not uploaded. Cover, input, and output fields are separate, so images can be arranged intentionally. Process steps have move-up/move-down controls.

## Database setup

Apply the SQL files in `supabase/migrations/` in order to a new Supabase project. It creates:

- Published content plus editor-only drafts and writes.
- User-owned saved resources with row-level security.
- A private subscriber list with recorded consent time.
- Bounded anonymous visitor events and editor-only aggregated metrics.
- A public media bucket with editor-only upload policies.

Set Supabase Auth's Site URL to the production site and allow `/admin` on production and local development as redirect destinations. Sign-in uses Supabase's email-link delivery; production email authentication should use your configured SMTP provider and limits.

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` must be set on Vercel for both production and preview before a new build. The server and browser use the same project, and no service-role key is needed.

## Newsletter boundaries

The site publishes web editions and stores newsletter signups. It does not send broadcast emails by itself. The authorized owner can export addresses and their unique unsubscribe URLs to an email provider. Include the unsubscribe URL in each campaign and connect a sending provider before sending campaigns. Do not use the authentication email channel for broadcasts.

## Analytics

Creator Studio displays actual 30-day visitor, page-view, copy, save, and top-resource counts plus the current subscriber total. No sample statistics are shown. A random browser identifier is used; raw IP addresses, prompt text, and reference images are not collected by the event endpoint. These figures are browser-based estimates, not verified people. The app also includes Vercel Web Analytics; its dashboard collection depends on enabling Web Analytics for the project. Review event retention as the site grows.

## Deployment

The intended Vercel team is Ajit (`team_B6Usx0nkTdjUvcbzVe6rrszB`), project `ai-tech-origin`, with the GitHub repository `ajitandroiddevelopment/ai-tech-origin`. Vercel's GitHub integration is connected to this repository; future `main` commits deploy automatically.

## Design and research

Functional reference research used REA browser evidence from the public reference websites. The application uses an original layout and original starter prompts, your supplied wordmark, rounded Nunito Sans typography, a neutral glass Library/Newsletter switch, desktop sidebar and mobile bottom navigation. Reference posters are not permanent site artwork. The reference site's prompt catalog and visual design were not copied. Detailed research evidence is kept locally in the ignored `work/` directory.
