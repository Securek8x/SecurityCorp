# Article visual guidelines

Authoritative policy and workflow for knowledge-article cover images and
in-body teaching visuals (Bead securitycorp-source-s41, pilot phase
s41.9-s41.12). This document is the single source of truth; `CLAUDE.md`
only points here and states a few short invariants — do not duplicate
this whole guide there.

Type-safe data shape lives in `lib/article-visuals.ts` (policy, workflow,
and data are kept separate per this document's own rule below).

This document is authoritative for **what** may ship and **when**: cover
policy, approval, the hybrid cover model, inventory, and migration. The visual *language*
those visuals are drawn in (shape, palette semantics, the five plate
archetypes, the review checklist) is defined in
[`graphic-and-diagram-language.md`](graphic-and-diagram-language.md), which
defers to this document on policy. Do not create a competing policy file.

Sections are labelled where it matters: **Historical decision** (kept as
the record; do not rewrite), **Current implementation** (what the code
does today), **Current policy** (binding now), and **Proposed** (future
direction; not binding until a human records a decision in Beads).

## Current state (verified 2026-09-27, after cover batch 1)

**Direction (Historical decision, still binding).** Bead
`securitycorp-source-s41.5`, recorded by Ravi Teja Thota on 2026-09-13,
selected a hybrid: **B — Schematic Plate** (code-native SVG) is *the* core
production system for covers, diagrams, catalog thumbnails, and social
cards; **C — Figure Budget** supplies in-body teaching figures for
high-value articles only; **A — Deep Field** (the cinematic raster covers)
is retained for existing brand moments only and is "explicitly NOT the
ongoing catalog-cover production model." The three approved raster covers
are kept unchanged as a legacy series. The raster-cover freeze in this
decision was amended on 2026-09-27 by s41.21 (see Hybrid cover model).

**Inventory (Current implementation).** Derived from the compiled
catalog by `lib/article-visual-inventory.ts` (`npm run
report:article-visuals`), with the baseline asserted in its test:

| Measure | Count |
|---|---|
| Published articles | 42 |
| Articles with a canonical cover | 13 |
| — approved raster cover (legacy A series) | 3 |
| — Schematic Plate in the cover position | 10 |
| Schematic Plates in total (9 pilot wave + 3 cover batch 1) | 12 |
| — plates rendered in-body because a raster cover holds the slot | 2 |
| Articles with **no** canonical cover | 29 |
| Covers with a recorded human approval | 13 of 13 |
| Articles with a code-native teaching diagram | 29 |
| Articles without one, teaching-figure need not yet assessed | 13 |

The two overlap articles (`understanding-network-trust-boundaries`,
`protecting-main-branch-beyond-pr-approval`) have a raster cover *and* a
plate: 3 + 12 − 2 = 13 covered articles. A teaching diagram is **not** a
cover; the 29 diagram articles are counted independently of cover state.

**Hybrid cover model (Current policy).** Owner decision
`securitycorp-source-s41.21` (Ravi Teja Thota, 2026-09-27) amended s41.5
and lifted the blanket raster-cover freeze: Schematic Plates stay the
preferred/default cover where a schematic fits; a raster/editorial cover
is permitted when it is the stronger treatment, and always needs human
visual approval. See [Hybrid cover model](#hybrid-cover-model) below.

## Why this exists

Every knowledge article on this site was originally text-only. That is
correct for a security-technical publication where prose precision
matters more than decoration, but it also means articles can read as
dense walls of text even when the underlying content is well-organized.
This system adds **purposeful** visuals — a cover per article, and
teaching diagrams where a workflow, boundary, or comparison is genuinely
easier to understand drawn than described — without turning the site
into a generic content-marketing blog.

## Visual roles and their mechanisms (Current implementation)

| Role | Mechanism | Rendered by |
|---|---|---|
| Teaching figure | `KnowledgeArticle["diagram"]` (code-native) | `components/diagrams/interactive-flow-diagram.tsx` |
| Cover — Schematic Plate | `ARTICLE_PLATES` in `lib/article-plates.ts` (code-native) | `components/diagrams/schematic-plate.tsx` via `knowledge-article-shell.tsx` |
| Cover — legacy raster | `KnowledgeArticle["coverImage"]` (`ArticleVisual`) | `components/article-figure.tsx` |

Cover, teaching figure, and human approval are tracked as three
independent states. The subsections below predate the Schematic Plate
system and describe the teaching-figure and `ArticleVisual` mechanisms;
they remain accurate for those two.

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
  state below. Under the s41.5 direction that cover is a Schematic Plate
  by default; a raster/editorial cover is a selective alternative (see
  Hybrid cover model).
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

> **Historical record, still the raster path.** This section records the
> s41.12 raster pilot (2026-09-04/05). The s41.5 decision (2026-09-13)
> froze this path; owner decision s41.21 (2026-09-27) re-admitted it as a
> *selective* cover path under the [hybrid cover model](#hybrid-cover-model)
> — never the automatic one, and never without human visual approval. The Figma note
> below is also historical: a Figma MCP may be available in an individual
> agent environment, but nothing in this repository depends on it (see
> [Figma](#figma-optional-future-finishing-layer-proposed)).

**This repository has no installed/MCP-integrated image-generation
tool** — the `ui-ux-pro-max` plugin's `banner-design` skill depends on a
separate `ai-multimodal` skill and a Python venv (`.claude/skills/.venv/`)
calling the Gemini API, neither of which is set up in this project's
`.claude/skills/` (only `impeccable/` and `article-visuals/` exist
there). The official Figma MCP was evaluated for this pilot and not
installed: nothing in this repository currently treats Figma as a source
of truth, and this repo-native SVG/React/CSS approach already satisfies
the "editable, code-native" requirement for teaching visuals; a raster
cover brief doesn't need a design tool round-trip to be written or
reviewed.

**A real, demonstrated capability does exist as an external human-in-
the-loop workflow**, established by the s41.12 pilot (2026-09-04/05):
Ravi generates the raster art externally (an image-generation tool such
as ChatGPT/Codex, outside this repo), hands off the raw source PNG(s)
plus a generation manifest recording the exact prompt/dimensions/hashes,
and Claude normalizes the source through the exactly-pinned
`sharp@0.35.4` devDependency (`scripts/normalize-cover-source.ts`) into
the final `webp` — verifying real decoded dimensions and stripped
metadata from the actual output bytes, not the declared numbers (see
`scripts/check-article-visuals.ts`). This was the pilot's generation
path; it does not require installing any new MCP server, plugin, or
automated generation service. It was frozen for new covers from
2026-09-13 to 2026-09-27 and is now a selective path (see above).

**Until an asset is actually produced this way**, every cover stays at
`stage: "brief"` — a complete, generation-ready brief with no image
file. Do not represent a brief as a finished visual. Do not generate a
placeholder and present it as final. Once a real asset exists (via the
path above), move the visual to `stage: "asset"` — never directly to
`stage: "reviewed"`, which only a human reviewer sets (see Lifecycle
below).

## Migration state (do not break the build)

`lib/article-visuals.ts` exports `VISUAL_GATE_ENABLED = false`. While
false, `checkCoverImageGate` (and therefore `npm run check:article-
visuals`) never fails a published article for lacking a cover — it only
warns. This is deliberate: 32 of the 42 published articles have no
cover (see Current state); requiring every article to have a cover today
would either block all future publishing or force rushed, generic visuals
to satisfy a gate, which is exactly what this system exists to prevent.
(When this section was first written the catalog had 32 published
articles and the 3 pilot covers were still briefs; both are now stale.)

**Do not flip `VISUAL_GATE_ENABLED` to `true` until:**
1. A real image-generation capability is approved and installed (see
   above) — *met: the external human-in-the-loop path, a selective cover
   path under the hybrid model (s41.21)*, and
2. Ravi has approved the pilot visual direction — *met: raster pilot
   approved 2026-09-05; B + C direction recorded 2026-09-13 (s41.5); plate
   pilot approved 2026-09-13 (s41.12)*, and
3. An approved backfill pass has given the existing catalog real
   covers — or an explicit decision has been made that some articles are
   exempt (a decision recorded in Beads, not assumed) — **not met**: 32
   published articles have no cover.

**Canonical cover definition (Current implementation, fixed 2026-09-27).**
`hasCanonicalCover` in `lib/article-visuals.ts` is the single definition
of "this article has a cover", used by `checkCoverImageGate`, the audit's
migration warning, and the inventory. It is true only for:

- a **human-approved raster cover** in the cover slot (stage `"reviewed"`
  + `reviewStatus: "approved"`), or
- a **Schematic Plate in the cover slot** (`coverSlotOccupant`, which
  mirrors `knowledge-article-shell.tsx`: a rendered raster takes the slot
  and pushes any plate in-body).

It is false for an unapproved raster asset, a brief, a file merely on
disk, a plate pushed in-body by an unapproved raster, and a teaching
diagram. Before this fix the gate recognised only a raster `coverImage`
(and counted an unapproved `"asset"` as a cover), so enabling it would
have failed the 7 plate-covered articles; the audit also warned about
them. Regression tests in `lib/article-visuals.test.ts` and
`lib/article-visual-inventory.test.ts` pin the distinction, including a
check that the enforced gate would fail exactly the 32 uncovered articles.
`VISUAL_GATE_ENABLED` remains `false`.

### Staged migration (Proposed — each stage needs a human decision)

1. **Now — inventory only.** The gate stays off. Missing covers are
   visible through `npm run report:article-visuals` and the audit's
   warnings; nothing is blocked. Existing published articles are backfill
   candidates, not failures.
2. **Transition — new articles warn.** Now that the gate recognises
   plates, a newly published article without a cover produces a visible
   warning (not an error) while backfill proceeds in bounded, human-
   approved waves like the nine-article plate pilot.
3. **After backfill — enforce.** Only once every published article has a
   human-approved cover or a Beads-recorded exemption may
   `VISUAL_GATE_ENABLED` become `true`. That flip is a **future policy
   decision** for Ravi, not something an agent introduces.

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

**Schematic Plates (Current implementation).** When an article has a plate
in `lib/article-plates.ts` and no rendered raster cover, the shell renders
the plate in the cover position. When a rendered raster cover exists, the
raster keeps the cover slot and the plate renders in-body before the
teaching diagram (the designated legacy/new coexistence case).
`lib/knowledge-catalog.ts`'s `toCard()` gives catalog cards a discriminated
thumbnail: a production-eligible raster cover wins; otherwise the plate
(bead s41.18). Social cards from plates (s41.19) are not built yet.

**Raster `coverImage`.** `components/knowledge-article-shell.tsx` renders `article.coverImage`
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
text lives on the full-size cover. No component invents another place
for a cover to appear; do not add one without updating this document.

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
- Missing raster dimensions, AND (as of `sharp@0.35.4`, Bead s41.12) a
  mismatch between declared `width`/`height` and the file's actual
  decoded pixel dimensions, plus any disallowed embedded metadata
  (EXIF/ICC/IPTC/XMP, a non-normalized orientation tag, embedded
  comments) still present in the file — see the visual-audit gaps note
  below for exactly what this does and does not cover.
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

**Dimension and metadata verification (closed 2026-09-05, Bead s41.12)**:
the audit used to check only that `width`/`height` were positive numbers
in the *declared* metadata, and did not inspect or strip embedded raster
metadata at all — both were named as known, deliberate gaps here. Ravi
authorized `sharp@0.35.4` as an exactly-pinned devDependency for exactly
this purpose (never used in production request handling — this site has
none, it's static export only). `scripts/check-article-visuals.ts` now
opens every existing raster referenced by a `coverImage`, decodes its
real metadata via `sharp`, and compares it against the declared record
using `lib/article-visual-assets.ts`'s `checkDimensionsMatch` (actual
vs. declared `width`/`height`) and `hasDisallowedMetadata` (flags
`exif`/`icc`/`iptc`/`xmp`, a non-normalized `orientation` tag, or
embedded comments) — both pure, unit-tested functions that don't import
`sharp` themselves, so `lib/*.test.ts` stays fast. The companion
normalization script, `scripts/normalize-cover-source.ts`, produces a
clean file in the first place: it auto-orients from EXIF (`.rotate()`)
*before* anything else, never calls `.withMetadata()` (sharp strips
source metadata by default unless you explicitly ask it to keep it —
easy to get backwards), and re-reads its own output from disk to
re-verify dimensions and metadata cleanliness before considering a file
done. This closes the gap for real; do not represent it as still
manual, and do not claim it covers more than what these functions
actually check (e.g. it does not attempt any deeper forensic metadata
scan beyond the fields named above).

Run the full suite (`lint`, `typecheck`, `test`, `check:route-integrity`,
`check:public-terms`, `check:privacy-leak-gate`, `guard:release`,
`build:pages`, `check:article-visuals`) before shipping any
article-visual change.

## Visual inventory (Current implementation)

`lib/article-visual-inventory.ts` derives one row per published article
from the compiled catalog — never from source text — with three
independent states:

- **Cover**: `raster` (a rendered `coverImage`), `plate` (a Schematic Plate
  in the cover position), or `none`. A raster cover that holds the slot
  while its plate renders in-body is flagged `inBodyPlate`. Occupying the
  slot is not the same as having a cover: `canonicalCover` applies
  `hasCanonicalCover`, the same definition the gate enforces. A
  "requires review/migration" state is expressed through approval, below,
  not a fourth cover value.
- **Cover approval**: `human-approved`, `pending-human-review`, or
  `not-applicable`. A raster cover is approved only when its own
  provenance is `stage: "reviewed"` + `reviewStatus: "approved"`
  (`isVisualProductionEligible`). A plate is approved only if it has a
  record in `PLATE_APPROVALS` (reviewer, date, source bead): the s41.12
  pilot wave (Ravi Teja Thota, 2026-09-13, nine plates) and cover batch 1
  (Ravi Teja Thota, 2026-09-27, three plates, d4e). **An asset existing in
  the repository is not approval, and an agent review is not human
  approval.** Only a human decision may add a record.
- **Teaching figure**: `present` (a code-native diagram exists),
  `recommended`, `unnecessary`, or `not-assessed`. `recommended` and
  `unnecessary` come only from `TEACHING_FIGURE_ASSESSMENTS`, which a
  human fills in; it is empty today, so all 13 articles without a diagram
  are `not-assessed`.

`npm run report:article-visuals` prints the table (`npm run
report:article-visuals -- --json` for machine output).
`lib/article-visual-inventory.test.ts` asserts the live summary equals
`VISUAL_INVENTORY_BASELINE`; when the catalog changes, update that
constant and the Current state table above in the same change. The
inventory is a report, not a gate: it never fails the build on a missing
cover.

## Hybrid cover model

**Current policy — owner decision `securitycorp-source-s41.21`** (Ravi Teja
Thota, 2026-09-27), amending s41.5:

- The blanket freeze on new raster/editorial covers is **lifted**. Raster
  does **not** become the universal or automatic cover format.
- **Schematic Plates remain the preferred/default cover** when a technical
  schematic meaningfully represents the article.
- **Raster/editorial AI-generated artwork is permitted** when it gives a
  stronger cover treatment than a plate. The choice is made per article on
  what communicates it best — no quota between the two formats.
- Teaching figures are independent of covers; an article may have a cover
  and one or more teaching figures.
- Every generated or imported cover goes through the existing human
  visual approval process (`stage: "reviewed"` + `reviewStatus:
  "approved"`, set only by a named human). Agent review is not human
  approval.
- Privacy, publication, technical, asset, and CI gates are unchanged;
  generated raster art still never carries factual labels.
- Long-term objective: every published article has an intentional
  canonical cover (see Migration state for how that becomes enforced).
- Rollout is bounded: the first step is a controlled five-article batch of
  briefs/specifications for Ravi's review; nothing is generated or
  integrated until he approves that batch. Figma is not introduced yet.

Plate expansion stays bounded too: each plate needs its own recorded human
approval in `PLATE_APPROVALS` (nine from the s41.12 pilot, three from cover
batch 1, see `docs/article-cover-batch-1.md`); `cloud-iam-permission-creep`
is on hold pending s41.22 and re-review.

### Former raster-cover freeze (Historical decision)

Kept as the record; it governed the s41.12 pilot and is no longer in force.

**Source.** The `securitycorp-source-s41.5` decision (Ravi Teja Thota,
recorded 2026-09-13T03:45Z): A — Deep Field is "explicitly NOT the ongoing
catalog-cover production model. No additional Deep Field covers during this
pilot." Restated in
[`graphic-and-diagram-language.md`](graphic-and-diagram-language.md) §1.

**Why.** The s41.5 decision text records the choice, not a separate
rationale. The recorded rationale in the design specs is that code-native
plates are their own editable source — typed, diffable in PRs,
deterministic, and accessible by construction — without the external
prompt/provenance/review burden of generated raster art
(`graphic-and-diagram-language.md` §8, following the s41.3 audit and s41.4
three-direction exploration).

**How it ended.** Amended by owner decision s41.21 on 2026-09-27, before
the pilot's closing gates (s41.13 QA, s41.14 workflow decision) ran. Those
beads remain open; s41.21 does not satisfy their acceptance criteria.

## Cover production workflow

The hybrid model itself is current policy (s41.21); the staffing and
tooling below remain proposed. The pipeline:

article → visual classification → visual brief → asset production (plate
spec by default; raster/editorial generation where it is the stronger
treatment) → human
visual review → optimization → metadata/integration → CI validation →
publication.

| Party | Responsibility |
|---|---|
| Claude / Codex | Understand the article; classify its archetype; write the technical brief; check technical meaning against the article's cited sources; integrate approved assets; write metadata and alt text; validate repository state; prepare the PR. |
| Image-generation system (raster/editorial covers only) | Produce editorial artwork from an approved brief. Never carries factual labels. |
| Repository / CI | Asset contract, metadata validation, format/dimension checks, approval gates, publishing safeguards (`check:article-visuals`, `checkAssetApprovalGate`, inventory baseline test). |
| Human (Ravi) | Final visual approval wherever this policy requires it. |

No agent converts its own review, or another agent's, into human approval.

**Archetypes.** Plate composition uses the five structural archetypes in
`graphic-and-diagram-language.md` §5 (Linear Flow, Sealed Enclosure,
Coverage Field, Gate Sequence, Divergent Pair), selected deterministically
from the article's structure. That taxonomy is authoritative. A proposed
topic taxonomy — network/architecture; application/code/supply chain;
identity/authn/authz; threat/exploitation; detection/response/operations;
governance/risk/compliance — may be used as a *classification aid* when
writing a brief (for example, to keep a backfill wave varied), but it
does not replace the structural archetypes and must not introduce a
second visual system. All of it stays inside the established language:
deep navy / near-black ground, restrained cyan with violet as a semantic
term, limited threat/emphasis colours, technical schematic geometry,
strong negative space, no glow, no generic hacker imagery.

## Figma: optional future finishing layer (Proposed)

Figma may later serve as an optional design-system and finishing layer —
reusable cover templates, layout grids and safe zones, brand overlays, a
component library, social/OG layouts, and deterministic derived assets.
It is **not** a publication dependency, not a source of truth for any
published visual (the typed spec in the repository is), and no Figma
tooling or dependency is added to this repository without a separate,
explicit decision.

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
