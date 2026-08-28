# SecurityCorp

Field notes from a working security engineer's home lab. Guides, project
write-ups, and the occasional argument about what "secure" actually means —
published as a static site, no tracking, no drama.

Live at [securitycorp.net](https://securitycorp.net).

## What this is

SecurityCorp documents real systems — containerized services, private
networking, detection tooling, a home lab that has broken in interesting
ways — from the first threat model through the last failed test. The goal
is writing that shows its work: tradeoffs, failure modes, and evidence, not
just a finished config and a victory lap.

Three audiences, one bar for accuracy:

- Working security engineers who want the parts most posts skip.
- People getting into the field who want something more useful than a
  listicle.
- Home-lab builders who want patterns they can actually run.

No fear-based marketing, no "hackers don't want you to know this," no
claims that aren't backed by something that was actually built and tested.

## Stack

- [Next.js](https://nextjs.org) (App Router), statically exported via
  `output: "export"` — no server runtime.
- React, TypeScript.
- Tailwind's PostCSS pipeline plus hand-written CSS in
  [`app/globals.css`](./app/globals.css) — the visual design isn't built
  from a component library.
- [`lucide-react`](https://lucide.dev) for icons.
- [`three`](https://threejs.org) — used only, and lazily loaded only, for
  the homepage hero's WebGL layer (see "Motion architecture" below); every
  other route never loads it.
- Deployed on Cloudflare Pages. No backend, no database, no application
  secrets — the whole site is HTML, CSS, and content data compiled at
  build time.

## Prerequisites

- Node.js 22.13.0 or newer (see `engines` in `package.json`).
- npm (ships with Node).

## Install

```bash
npm ci
```

Use `npm ci`, not `npm install`, for a reproducible tree from
`package-lock.json` — that's also what CI and Cloudflare Pages run.

## Local development

```bash
npm run dev
```

Starts the Next.js dev server at `http://localhost:3000`.

## Full local validation

```bash
npm run check
```

Runs lint, then a TypeScript typecheck, then the static production build,
in that order. This is the command to run before opening a PR — it's the
same bar Cloudflare Pages holds the build to. Individually:

```bash
npm run lint        # eslint .
npm run typecheck   # tsc --noEmit
npm run build:pages # next build -> out/
```

## Production preview

```bash
npm run build:pages
npm start
```

`npm start` serves the built `out/` directory locally (via `serve`) so you
can check the actual static export — redirects, headers behavior, and
routing — rather than the dev server's behavior, which can differ.

## Testing strategy

There is still no separate unit or integration test suite — the meaningful
checks are that every route type-checks, lints clean, and produces valid
static HTML, which `npm run check` verifies. The site does now have one
piece of non-trivial client-side logic (the motion controller below);
verifying it means driving the actual static export in a real browser
(local `npm run build:pages && npm start`, or Cloudflare's own preview
deploy) rather than adding a test harness — checking route/console/
hydration errors, `prefers-reduced-motion` behavior, and offscreen/
hidden-tab pausing by hand or with a throwaway script, not committed to
the repo.

### Motion architecture

Decorative motion (the hero network, the three guide architecture
diagrams, the build-log circuit, and the case timeline) is CSS-driven —
`stroke-dasharray`/`stroke-dashoffset` for line-drawing, `offset-path` for
moving packets, `opacity`/`transform` for pulses — with timing tokens
centralized in `app/globals.css` under "MOTION SYSTEM". The only runtime
JavaScript involved is `components/motion-controller.tsx`, one shared
`IntersectionObserver` mounted once in `Shell` that starts play-once
sequences when they enter the viewport, toggles looping sequences between
active/paused as they enter/leave the viewport, and pauses everything
looping while the tab is hidden (`document.visibilityState`). It exists
because that lifecycle — pause offscreen, pause in a hidden tab, play a
sequence exactly once — has no CSS-only equivalent; every other motion
effect in the redesign has none. The control-under-test failure-path
diagram and the project-card hover schematics don't use it at all: the
former restarts via a normal React `key` remount on tab change, the latter
is driven purely by `:hover`/`:focus-within`.

**Static fallback and reduced motion**: the CSS default for every motion
primitive is the complete, fully-drawn state — animation is added on top
via `[data-js-motion="true"]` (set by the controller on `<html>`, so
nothing regresses without JavaScript) and only inside
`@media (prefers-reduced-motion: no-preference)`. A user with `no-JS`, or
with `prefers-reduced-motion: reduce`, sees every diagram fully drawn and
legible immediately — never a blank or partially-drawn state waiting on
JavaScript.

**The WebGL hero** (`components/hero-webgl-canvas.tsx`, `three` — the only
non-dev dependency beyond Next/React) is an isolated, lazily-loaded layer
behind the always-present, already-complete `components/diagrams/
hero-network.tsx` SVG — never a replacement for it. `hero-scene-loader.tsx`
decides whether to even fetch the WebGL module at all: it skips entirely
under `prefers-reduced-motion: reduce`, `(pointer: coarse)`,
`navigator.connection.saveData`, or no WebGL context, so most mobile and
all reduced-motion visits never download it. When it does run, it owns its
own lifecycle — pauses via `IntersectionObserver` and the shared
`useTabHidden()` hook, disposes all Three.js resources on unmount, and
falls back to the SVG (crossfading back in) on WebGL context loss. Card
tilt (`components/interactive-surface-controller.tsx`) and the guide
diagrams' node-hover/mode-toggle/replay interactivity
(`components/diagrams/interactive-flow-diagram.tsx`, shared by all three
guides) follow the same rule: CSS custom properties written directly from
`requestAnimationFrame`, never React state per pointer move, and every
interactive affordance (node exploration, mode switching, replay) has a
keyboard-operable equivalent — see `diagram-explore-panel` and
`diagram-controls` in `app/globals.css`.

## Appearance

The header offers a **Light/Dark** appearance toggle. On a first visit, the
initial palette follows the operating system; a toggle choice is saved only
in browser `localStorage` under `securitycorp-theme`. The site uses no cookie,
backend, or analytics event for the setting.

`app/layout.tsx` includes a small, static head script that resolves the saved
choice before first paint. It sets `data-theme` on the document root, while
the semantic tokens in [`app/globals.css`](./app/globals.css) supply both
palettes. New components should use those semantic tokens rather than fixed
theme colors. Code blocks intentionally remain dark in both modes for
technical-content readability. The projects preview is also intentionally
inverted, using dedicated on-dark tokens so its text remains readable in
either page theme.

The script is permitted by the existing Cloudflare Pages CSP's established
`script-src 'self' 'unsafe-inline'` directive. It makes no network request
and does not use eval. Theme changes receive a short color-only transition;
initial paint and reduced-motion environments do not animate.

When reviewing a change, test both choices, reload after a selection, and
repeat with reduced motion enabled. `npm run check` confirms the static export
remains compatible with Cloudflare Pages.

## Editing content

Articles and project entries live in `lib/content.ts` as plain TypeScript
data — not separate markdown files. Routes are generated from that data at
build time via `generateStaticParams()`; no other file needs to change to
publish a new guide or project.

To add a new article, add an entry to the `articles` array with a unique
`slug`, then fill in the rest of the `Article` shape (title, dek, category,
level, read time, date, intro, and an ordered list of `sections`, each with
a heading, paragraphs, and an optional code block). See
[`CONTRIBUTING.md`](./CONTRIBUTING.md) for the exact field shape, the voice
guidelines, and what every guide should include (a tested failure path, not
just the happy-path config).

To add or edit a project, edit the `projects` array in the same file.

## Cloudflare Pages settings

| Setting                | Value                         |
| ----------------------- | ----------------------------- |
| Production branch       | `main`                        |
| Framework preset         | Next.js (Static HTML Export)  |
| Build command            | `npm run build:pages`         |
| Build output directory   | `out`                         |
| Root directory           | `/`                           |
| Node.js version          | 22                            |

Every push to `main` deploys to production. Every pull request gets its own
preview URL — use it, don't guess from a diff. See
[`docs/cloudflare-pages.md`](./docs/cloudflare-pages.md) for the full setup
and domain-configuration walkthrough.

## Privacy, before you publish anything

This site is inspired by real infrastructure. It must never contain:

- Private or public egress IP addresses
- Internal hostnames or private DNS records
- Credentials, API keys, tokens, usernames, or private key material
- Real filesystem paths
- Tracker or account identities
- Exact firewall rules tied to a specific environment
- The author's employer
- Anything that makes a real home network easier to target

Generalize the example, keep the lesson. See
[`SECURITY.md`](./SECURITY.md) for the full pre-publish checklist and the
grep-based scan to run before committing.

## Repository structure

```
app/                 Routes (App Router). Each page.tsx owns its own
                     route-level metadata (title, description, Open Graph,
                     Twitter Card, canonical URL).
  guides/[slug]/     Dynamic article route, statically generated via
                     generateStaticParams() from lib/content.ts.
  not-found.tsx      Custom 404, statically exported to out/404.html.
  robots.ts          Generates robots.txt at build time.
  sitemap.ts         Generates sitemap.xml from lib/content.ts, covering
                     every static route and article.
  opengraph-image.tsx Generates the default social-share image.
components/          Shared UI (header, footer, page shell).
lib/content.ts       All article and project content, as typed data.
public/              Static assets served as-is: favicon, _headers,
                     _redirects.
docs/                Deployment documentation.
```

## Deployment overview

GitHub is the source of truth. Cloudflare Pages watches the `main` branch,
runs `npm run build:pages`, and deploys the `out/` directory automatically
— there's no manual deploy step, and there shouldn't be one. Pull requests
get their own preview deployment for review before merge.

## Known limitations

- Single-author content model — there's no CMS, no draft/review workflow
  beyond a pull request, and no scheduled publishing.
- No automated test suite (see Testing strategy above) — correctness is
  enforced by typecheck, lint, and a successful static build, not by
  behavioral tests.
- Content dates and "last reviewed" fields are only as accurate as they're
  kept — there's no automation that flags stale articles.
