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
  `validateArticleVisual` runs every free-text field through
  `lib/privacy-leak-gate.ts`'s structural scanner as a backstop; it does
  not replace human judgment.

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
| `mobileCropNotes` | What must survive a narrow-viewport crop. |
| `exportFormats` | e.g. `["avif", "webp"]`. |
| `sizeBudgetKb` | A real number, checked by `npm run check:article-visuals` once an asset exists. |

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
`reviewStatus: "approved"` record requires a named `reviewer` and
`reviewedAt` — **an agent must not approve its own design work**; only a
human reviewer (in practice, Ravi) sets this to `"approved"`.

## Where a cover renders

`components/knowledge-article-shell.tsx` renders `article.coverImage`
(when present and past `stage: "brief"`) right after the lead paragraph
and before the prerequisites box — after the article's own intro, before
the first instructional content, matching the existing shell's reading
order. `components/knowledge-catalog-filter.tsx` renders the same
asset as a card thumbnail (`alt=""` there deliberately — the card's own
heading already gives the link an accessible name; the meaningful alt
text lives on the full-size cover). Neither component invents a second
place for a cover to appear; do not add one without updating this
document.

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

`npm run check:article-visuals` (`scripts/check-article-visuals.ts`)
checks every article's `coverImage` (when present) via
`validateArticleVisual`, plus filesystem-level concerns pure data
validation can't catch: missing referenced files, oversized rasters
(400KB budget), missing raster dimensions, unsafe SVG (`<script>`,
inline event handlers, external `xlink:href`, XML entities), orphaned
files under `public/article-visuals/`, and unsupported formats. It also
runs `checkCoverImageGate`, a no-op while `VISUAL_GATE_ENABLED` is
false. Run it alongside the rest of the standard validation suite
(`lint`, `typecheck`, `test`, `check:route-integrity`, `check:public-
terms`, `check:privacy-leak-gate`, `guard:release`, `build:pages`)
before shipping any article-visual change.

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
