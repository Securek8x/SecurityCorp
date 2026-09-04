# Article visual guidelines

Authoritative policy and workflow for knowledge-article cover images and
in-body teaching visuals (Bead securitycorp-source-s41, pilot phase
s41.9-s41.12). This document is the single source of truth; `CLAUDE.md`
only points here and states a few short invariants — do not duplicate
this whole guide there.

Type-safe data shape lives in `lib/article-visuals.ts` (policy, workflow,
and data are kept separate per this document's own rule below).

## Why this exists

Every knowledge article on this site was originally text-only. That is
correct for a security-technical publication where prose precision
matters more than decoration, but it also means articles can read as
dense walls of text even when the underlying content is well-organized.
This system adds **purposeful** visuals — a cover per article, and
teaching diagrams where a workflow, boundary, or comparison is genuinely
easier to understand drawn than described — without turning the site
into a generic content-marketing blog.

## Two kinds of visual, two different mechanisms

**Teaching visuals** (a factual diagram of a workflow, trust boundary, or
comparison) use the **existing** `KnowledgeArticle["diagram"]` field and
`components/diagrams/interactive-flow-diagram.tsx` — code-native
SVG/React, already accessible (keyboard-explorable nodes, ARIA labels),
already reviewed through the normal PR process. **Do not build a second
diagram system.** If an article needs a teaching visual, check whether
the existing diagram mechanism already covers it before reaching for
anything new — most of this catalog's existing diagram-bearing articles
already do.

**Cover/hero visuals** and any future in-body illustration are the
genuinely new surface this system adds: `lib/article-visuals.ts`'s
`ArticleVisual` type, rendered by `components/article-figure.tsx`. This
document is mostly about that surface.

## The main visual model

- Every published article should eventually have one purposeful
  cover/hero visual. Not every article needs one *today* — see Migration
  state below.
- Articles should have one or two in-body teaching visuals when they
  materially improve understanding — not to break up text for its own
  sake.
- **If a visual could fit ten unrelated security articles, reject it.**
  A cover must be specific to *this* article's actual thesis, not
  generic "security" imagery (a padlock, a shield, a hooded figure at a
  terminal, a wall of green code). Generic imagery is the single most
  common way this kind of system degrades over time — enforce this on
  every brief, including your own.
- Custom editorial visuals only. Never stock hacker imagery, hooded
  figures, generic locks, random code screens, meaningless HUD overlays,
  excessive glow, or visual noise.
- Preserve the existing deep-navy, cyan, and purple netrunner language
  (see `DESIGN.md`) with restrained semantic accents — a cover is an
  extension of the existing visual world, not a second one.
- **Generated raster artwork must never contain important labels,
  commands, protocol details, diagrams, or other factual text.** Factual
  content belongs in code-native SVG/React/HTML (the diagram mechanism
  above), not baked into a raster image where it can't be updated,
  translated, or read by a screen reader.
- Never place real infrastructure details, hostnames, IP addresses,
  credentials, tokens, personal data, or identifiable private
  screenshots in a visual, its prompt, its filename, or its metadata —
  per `docs/publication-safety-policy.md`. `lib/article-visuals.ts`'s
  `validateArticleVisual` runs `lib/privacy-leak-gate.ts`'s structural
  scanner across every free-text field on both the visual and its
  nested brief — `alt`, `caption`, `credit`, `purpose`,
  `provenance.prompt`, `provenance.editableSourceRef`,
  `provenance.creator`, and the brief's `readerTakeaway`,
  `whyThisHelps`, `placement`, `compositionNotes`, `mobileCropNotes`,
  every `mustShow`/`mustNotShow` entry, and every factual claim's
  `claim`/`source` text — as a backstop; it does not replace human
  judgment.

## Capability status (read this before writing a brief)

**This repository has no working image-generation capability installed
as of 2026-09.** The `ui-ux-pro-max` plugin's `banner-design` skill
depends on a separate `ai-multimodal` skill and a Python venv
(`.claude/skills/.venv/`) calling the Gemini API — neither is set up in
this project's `.claude/skills/` (only `impeccable/` exists there). The
official Figma MCP was evaluated for this pilot and not installed:
nothing in this repository currently treats Figma as a source of truth,
and this repo-native SVG/React/CSS approach already satisfies the
"editable, code-native" requirement for teaching visuals; a raster cover
brief doesn't need a design tool round-trip to be written or reviewed.

**Until a capability is actually approved and installed**, every cover
stays at `stage: "brief"` — a complete, generation-ready brief with no
image file. Do not represent a brief as a finished visual. Do not
generate a placeholder and present it as final. When a real capability
is approved, generate directly from the stored brief (the brief's
`mustShow`/`mustNotShow`/composition fields are written to be handed to
a generator as-is) and move the visual to `stage: "asset"`.

## Migration state (do not break the build)

`lib/article-visuals.ts` exports `VISUAL_GATE_ENABLED = false`. While
false, `checkCoverImageGate` (and therefore `npm run check:article-
visuals`) never fails a published article for lacking a cover — it only
warns. This is deliberate: the catalog has 32 published articles and 3
pilot briefs; requiring every article to have a cover today would either
block all future publishing or force rushed, generic briefs to satisfy a
gate, which is exactly what this system exists to prevent.

**Do not flip `VISUAL_GATE_ENABLED` to `true` until:**
1. A real image-generation capability is approved and installed (see
   above), and
2. Ravi has approved the pilot visual direction (the three-article pilot
   this document accompanies), and
3. An approved backfill pass has given the existing catalog real
   covers — or an explicit decision has been made that some articles are
   exempt (a decision recorded in Beads, not assumed).

## The brief template

Every visual — cover or in-body — starts as a `VisualBrief`
(`lib/article-visuals.ts`), required at every stage, kept as the durable
record of what was asked for even after an asset exists. Fields, in the
order `validateArticleVisual` expects them:

| Field | Purpose |
|---|---|
| `articleSlug` | Canonical slug — must match the article it's attached to. |
| `readerTakeaway` | The exact thing a reader should understand from this visual alone. |
| `whyThisHelps` | Why prose isn't enough for this specific point. |
| `visualType` | `"cover"` or `"in-body-illustration"`. |
| `placement` | Where in the article shell/section this visual sits. |
| `mustShow` | Concrete elements the visual must include. |
| `mustNotShow` | Concrete elements it must exclude — always include generic-imagery and real-infrastructure exclusions explicitly. |
| `factualClaims` | Any factual relationship the visual depicts, each with a real source (the article's own cited sources, not invented). |
| `compositionNotes` | Aspect ratio, layout direction, palette constraints. |
| `mobileCropNotes` | What must stay legible/composition-safe at a narrow viewport. **Not a literal crop claim** — the full article-page cover only ever scales (`app/globals.css`'s `.article-figure img` is `width:100%;height:auto`, never cropped). A real crop only happens on the catalog-card thumbnail (`.guide-card-thumb{object-fit:cover}`), driven by `focalPoint`. Write this field as "X must stay legible when scaled down," and use it to justify a `focalPoint` choice for the one surface that actually crops. |
| `exportFormats` | Exactly **one** format, e.g. `["webp"]` — the current rendering contract (`ArticleVisual.src` / `ArticleFigure`) delivers a single file per visual; there's no `<picture>`/multi-source model yet. `validateArticleVisual` rejects more than one entry here. |
| `sizeBudgetKb` | This visual's own size budget in KB — enforced **per-visual**, not against one shared global number, by `npm run check:article-visuals`. A separate, generous absolute ceiling (1MB) still applies as a backstop even if a brief sets an unreasonably large budget. |

`alt`, `caption`, `credit`, `purpose`, `width`/`height`, `focalPoint`,
and `provenance` live on the parent `ArticleVisual`, not inside the
brief — see the type definition for the full shape.

## Provenance

Every visual records `VisualProvenance`: `source` (`"ai-generated"` |
`"human-illustrated"` | `"photographed"` | `"brief-only"`), `createdAt`,
`license`, `editableSourceRef`, and `reviewStatus`
(`"pending"`|`"approved"`|`"needs-revision"`|`"rejected"`). An
`ai-generated` asset additionally requires `generatingModel` and
`prompt` (and `seed` when the generator supports one) once it's past
`stage: "brief"` — this is what makes the asset reproducible and
auditable later, not just a file that happened to appear. A
`human-illustrated` or `photographed` asset requires a named `creator`.
A `reviewStatus: "approved"` record requires a named `reviewer` and
`reviewedAt` — **an agent must not approve its own design work**; only a
human reviewer (in practice, Ravi) sets this to `"approved"`.

## Lifecycle, human approval, and production eligibility

Two separate concerns, kept deliberately apart — conflating them was a
real defect this document used to have:

1. **Coverage**: does a published article have a cover *at all*?
   Governed by `VISUAL_GATE_ENABLED` / `checkCoverImageGate` (see
   Migration state above) — disabled during the migration period, and
   even once enabled, only checks "is there SOME cover," not whether it's
   approved.
2. **Approval**: if a cover *is* present, is it actually human-approved
   for production? Governed by `isVisualProductionEligible` /
   `checkAssetApprovalGate` (`lib/article-visuals.ts`) — **always on**,
   never gated by `VISUAL_GATE_ENABLED`. This is what actually enforces
   the human-approval requirement.

The lifecycle states and what each one means for rendering vs. approval:

- **`stage: "brief"`**: no file. Never renders. Trivially "eligible"
  (there's nothing to approve). May sit at this stage indefinitely.
- **`stage: "asset"`**: a real file exists. **Renders** on the article's
  own page — including on an unmerged PR branch's Cloudflare Pages
  preview, deliberately, so a human reviewer can actually see it. **Not
  production-eligible** while `reviewStatus` is `"pending"`,
  `"needs-revision"`, or `"rejected"` — `checkAssetApprovalGate` fails
  for any of those, which is what actually blocks the PR's required CI
  check (and therefore the merge) even though the image itself is
  visible on the preview.
- **`stage: "reviewed"`**: requires `reviewStatus: "approved"` with a
  named `reviewer` and valid `reviewedAt` — `validateArticleVisual`
  enforces this pairing in both directions (`"approved"` requires stage
  `"reviewed"`; stage `"reviewed"` requires `"approved"`), so an agent
  cannot construct a record that reads as approved without an actual
  human approval behind it. Only `stage: "reviewed"` +
  `reviewStatus: "approved"` is production-eligible.

The catalog-card thumbnail (`components/knowledge-catalog-filter.tsx`)
is treated as a stricter, production-only surface: `lib/knowledge-
catalog.ts`'s `toCard()` only sets a `thumbnail` when
`isVisualProductionEligible` is true, so a pending/rejected/needs-
revision asset never appears there, even on a preview build. The
article's own cover is the one surface that intentionally renders an
unapproved asset, because that's what makes review possible in the first
place.

## Where a cover renders

`components/knowledge-article-shell.tsx` renders `article.coverImage`
(when present and past `stage: "brief"`, regardless of `reviewStatus` —
see Lifecycle above) right after the lead paragraph and before the
prerequisites box — after the article's own intro, before the first
instructional content, matching the existing shell's reading order. It
renders with `priority` set (eager `loading`, high `fetchPriority`),
since a cover there is almost always already in or near the viewport on
load; an in-body illustration should NOT set `priority` and stays lazy
by default. `components/knowledge-catalog-filter.tsx` renders the same
asset as a card thumbnail, but only once it's production-eligible (see
Lifecycle above) — `alt=""` there deliberately, since the card's own
heading already gives the link an accessible name and the meaningful alt
text lives on the full-size cover. Neither component invents a second
place for a cover to appear; do not add one without updating this
document.

`presentation="wide"` and `presentation="inline"` on `ArticleFigure`
currently render **identically** within the article shell — both sit
inside the shared `.article-page article{max-width:900px}` column, so
`wide`'s own `max-width:min(1100px,92vw)` rule can never actually be
reached; the parent caps it first. This is intentional and unchanged
from the incumbent shell (breaking a figure out past the shared 900px
column is a layout change to that shell, not something this pilot has
authorization to make) — the `wide`/`inline` distinction exists in the
component's API for a possible future non-nested context, not because it
currently does anything different. Do not describe `wide` as "breaking
out" of the article column; it doesn't.

## Reuse for cards and social images

A cover's asset is meant to be reused, not regenerated per surface. Do
not bake the article title into the hero artwork — `securitycorp-
source-wq4` (dynamic per-article OG/social-share images, a separate,
not-yet-built bead) is expected to render the title as code (matching
the existing `/opengraph-image.png` mechanism's approach) over a
cropped/composited version of the same cover asset, not a second
AI-generated image. This document's cover briefs are written with that
reuse in mind (see `compositionNotes`/`mobileCropNotes`), but building
the actual OG-image pipeline is `wq4`'s scope, not this pilot's.

## The visual-audit command

`npm run check:article-visuals` (`scripts/check-article-visuals.ts`,
using pure logic split into `lib/article-visual-assets.ts` for path
safety, per-visual budget, and SVG-pattern checks — each unit-tested in
`lib/article-visual-assets.test.ts`) checks every article's `coverImage`
(when present) via `validateArticleVisual`, plus filesystem-level
concerns pure data validation can't catch:

- Missing referenced files.
- Oversized rasters — enforced against **that visual's own**
  `brief.sizeBudgetKb`, not one shared global number, with a separate
  1MB absolute ceiling as a backstop.
- Missing raster dimensions (declared metadata only — see the dimension-
  verification gap below).
- Unsafe SVG: `<script>` tags, inline event-handler attributes, external
  `xlink:href` **or bare `href`** references, `<foreignObject>`, and XML
  external entities. **This is a targeted check, not a comprehensive SVG
  sanitizer** — it does not cover `@import`/`url(...)` inside an embedded
  `<style>` block, SMIL `<animate>`/`<set>` scripting, or any other form
  not listed above.
- Unsafe or malformed asset paths: an asset's declared `src` must start
  with `/article-visuals/` and resolve (after normalization) inside
  `public/article-visuals/` — `..` traversal, backslashes, query
  strings/fragments, absolute filesystem paths, and any external URL are
  all rejected before the path is ever read from disk.
- Orphaned files under `public/article-visuals/`, walked **recursively**
  (a per-article subdirectory is a permitted layout, even though the
  current pilot uses flat filenames).
- Unsupported formats.

It also runs `checkCoverImageGate` (a no-op while `VISUAL_GATE_ENABLED`
is false) and `checkAssetApprovalGate` (**always on** — see Lifecycle
above). It is wired into CI (`.github/workflows/ci.yml`'s "Article visual
audit" step) and into `npm run check`, so a green required check
actually proves it ran — this document is not the only enforcement.

**Known, deliberate gaps — do not claim otherwise:**

- **Dimension verification**: the audit checks only that `width`/`height`
  are positive numbers in the metadata. It does **not** open an
  AVIF/WebP/PNG/JPEG file and compare its real pixel dimensions against
  the declared ones. Adding that would need a new image-inspection
  dependency (e.g. `image-size`), which has not been added — a new
  dependency requires Ravi's explicit authorization (exact package,
  pinned version, reason, dependency-review result) first. Until then, a
  real asset's dimensions must be manually confirmed before it's
  promoted past `stage: "asset"`.
- **Metadata stripping**: the audit does not inspect or strip embedded
  metadata from a raster file. A generated or imported asset must be
  manually normalized/stripped before being promoted past `stage:
  "asset"` — this is a human-process requirement today, not an automated
  guarantee.

Run the full suite (`lint`, `typecheck`, `test`, `check:route-integrity`,
`check:public-terms`, `check:privacy-leak-gate`, `guard:release`,
`build:pages`, `check:article-visuals`) before shipping any
article-visual change.

## Keep policy, workflow, and data separated

- **Policy** (this document): what a good visual is, what's forbidden,
  when the gate turns on.
- **Workflow** (`.claude/skills/article-visuals/SKILL.md`): how an agent
  actually goes from "this article needs a visual" to a reviewed brief
  or asset.
- **Data** (`lib/article-visuals.ts`): the type-safe shape and
  validation logic, with zero policy prose embedded in it beyond
  comments explaining *why* a field exists.

Don't let any of the three drift into the others. If a rule changes,
change it here first, then the skill's workflow steps, then the type
comments if the shape itself needs to change.
