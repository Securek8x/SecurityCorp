# Visual Pilot — Design Specifications

Covers beads `s41.8` (homepage hero), `s41.9` (representative article),
`s41.10` (technical diagram), `s41.11` (social card). Each section states which
bead it satisfies.

Authority: `s41.5` decision by Ravi Teja Thota, 2026-09-13 — defined **B + C
hybrid**. Foundations: [`code-native-design-system.md`](code-native-design-system.md),
[`graphic-and-diagram-language.md`](graphic-and-diagram-language.md).

**None of these sections modify production code.** Implementation happens under
`s41.12`, and the hero's implementation routes through `0nv`/`hcx` instead.

---

## 0. Corrected diagram baseline and how to count it

The `s41.5` decision text described the wave as "all eight currently published
articles that already contain a code-native diagram". **That baseline was
wrong.** The corrected, verified figures are:

| Measure | Value |
|---|---|
| Published articles | 42 |
| **Published articles carrying a code-native diagram** | **29** |
| Published articles with no diagram | 13 |

**Why the original count was wrong.** It came from grepping source text for an
inline `diagram:` property. Eight article files write `diagram: buildDiagram()`
directly; the other twenty-three assign a `const diagram = {…}` and pass it
with object shorthand. Both compile to an identical `KnowledgeArticle.diagram`
value, so the "eight" was a formatting artifact, never a real category — and
the eight it produced happened to all sit in one category, which would have
made the pilot's variety demonstration meaningless.

**The fixed counting method.** `lib/article-plates.ts` exports
`publishedArticlesWithDiagram()`, which filters the *compiled catalog* and is
therefore blind to declaration style. `DIAGRAM_ARTICLE_COUNT` records the
baseline and is asserted against the live catalog by two tests, one of which
explicitly guards against regressing to 8.

> **Rule: never count article features by grepping source text.** Count from
> the compiled catalog. Source style is not a semantic category, and any future
> audit of coverage (diagrams, covers, claims, freshness) must follow the same
> rule.

The wave remains capped at exactly nine; its membership was re-derived under
the deterministic rule recorded in `s41.5` and in `lib/article-plates.ts`.

---

## A. Homepage hero pilot — `s41.8`

### A.1 Scope, as narrowed by the s41.5 decision

The holographic tiger **survives as a homepage-only brand signature**. It is
explicitly **not** converted into the Schematic Plate node-constellation
treatment. Direction B's node-constellation hero, mocked in the s41.4 study, is
therefore **rejected for this phase** and recorded here only so the rejected
alternative is not lost.

What remains in scope for the hero is refinement, not replacement:

1. Harmonise the hero with the shared cyan/violet tokens.
2. Correct mobile containment (the H1/tiger overlap).
3. Preserve purpose, page structure, identity and the Three.js scene.

The expressive hero is an **intentional, scoped exception** to the B+C system.
Article and catalog surfaces do not inherit it, and it does not inherit theirs.

### A.2 Composition and focal hierarchy

Unchanged: wordmark → descriptor → primary action, left; tiger, right. The
refinement is relational, not structural — the tiger currently floats in a void;
it should sit in a defined stage so the eye reads *heading first, guardian
second*.

| Element | Refinement |
|---|---|
| H1 | Unchanged size/weight; gains a guaranteed collision-free box (A.4) |
| Descriptor | Unchanged |
| Primary action | Unchanged |
| Tiger | Gains an explicit stage bounds; never overlaps text at any width |

### A.3 Token harmonisation

Replace any hero-local literal colour with the shared tokens: cyan edge light
from `--acid`, secondary accent from `--accent2`, ambient wash from
`--ambient-1` / `--ambient-2`, grid from `--grid-line`. No new colour is
introduced. The four verified incumbent accents in `app/globals.css` carrying
narrow `side-tab` waivers stay as-is; this refinement must not widen them.

### A.4 Responsive behaviour

| Width | Layout |
|---|---|
| ≥ 901px | Two-column. Tiger right, text left. Current behaviour. |
| 768–900px | Two-column, tiger scaled to ≤ 40% width. |
| < 768px | **Single column. Tiger moves into a contained stage box *below* the H1 and descriptor, never behind them.** |

The `< 768px` rule is the fix for bead `hcx` (H1/tiger overlap, confirmed
reproducible at 375px by the `s41.3` audit). Containment must come from layout
flow, not a negative z-index or an opacity dodge — both leave the tiger
colliding in forced-colors and print.

### A.5 Theme, motion and fallback states

| State | Requirement |
|---|---|
| Dark | Current appearance preserved |
| Light | Hero must not become a dark slab; ambient washes use light-theme token values |
| `prefers-reduced-motion: reduce` | Static frame. Already the default posture — motion is opt-in repo-wide |
| No WebGL / no JS | Existing `hero-tiger-image` static fallback path |
| Print | Hero suppressed or static; no layout collapse |

### A.6 Payload

No increase to the hero's JS or texture payload. The refinement is layout and
tokens. `s41.13` QA should confirm no INP regression, since bead `01k` already
flags the Three.js hero as the site's existing INP risk class.

### A.7 Editable source

The hero's source remains `components/hero-visual.tsx`,
`components/hero-webgl-canvas.tsx`, `components/hero-tiger-image.tsx` and the
hero rules in `app/globals.css`. No new binary asset is introduced by this spec.

### A.8 Implementation routing

Implementation of A.3 and A.4 belongs to beads `0nv` and `hcx`, both
cross-linked to the `s41.5` decision. **This spec does not close them and does
not satisfy their acceptance criteria.**

---

## B. Representative article pilot — `s41.9`

### B.1 Shell posture

Uses the existing shared `.article-page` shell
(`components/knowledge-article-shell.tsx`) for both `/guides` and `/knowledge`.
**No parallel article template is created.** Content width, numbered sections,
sticky TOC and information architecture are unchanged.

### B.2 State coverage

Every state below already exists in the shell and must keep rendering correctly
with a plate present and with no visual at all:

| State | Plate interaction |
|---|---|
| Heading hierarchy, dek, byline | Unchanged |
| Evidence metadata badge | Unchanged; plate may echo the state but never contradict it |
| Change note (`What changed`) | Unchanged |
| Prerequisites callout | Plate sits above it, matching the legacy cover slot position |
| TOC | Plate is not a numbered section and never enters the TOC |
| Code blocks, tables, warnings, citations | Unchanged |
| Pager, related content | Unchanged |
| **No-visual article** | Renders exactly as today. Visuals are additive. |
| **Legacy-cover article** | Cover slot keeps the raster cover; plate appears in-body |

### B.3 Cover slot behaviour

The article shell's cover slot currently requires
`coverImage.stage !== "brief" && coverImage.src`. A code-native plate has no
`src`. Two options, and the pilot takes the second:

1. Force a rasterised plate into `src` — rejected; it discards native theming,
   the whole point of direction B.
2. **Render the plate as a first-class code-native visual in the same slot
   position, sharing `ArticleFigure`'s framing, caption and credit.** The legacy
   raster path is untouched.

This is what makes legacy and new coexist deliberately rather than accidentally
(`graphic-and-diagram-language.md` §9).

### B.4 Themes, motion, print, responsive

Phone / tablet / desktop per `code-native-design-system.md` §5. Dark and light
native. Reduced-motion is the default resting state. Print: the plate must
render on the existing monochrome print stylesheet without relying on colour —
which the geometry-plus-colour redundancy rule already guarantees.

### B.5 Hierarchy without chrome

The plate replaces prose that was doing structural work; it does not add a
decorative band. No new borders, no nested cards, no additional headings.

---

## C. Technical diagram pilot — `s41.10`

### C.1 Example

Synthetic, technically meaningful, fictional throughout: a four-zone
architecture — ingress, application tier, data tier, administrative plane —
where the first three are connected by sanctioned paths of differing volume and
the administrative plane is sealed with no path reaching it. This is the
`segmentation vs isolation` thesis and is already the established semantic of
the first approved cover. **No real hostname, address, port, product or
configuration appears.**

### C.2 Vocabulary demonstrated

Nodes (zones), edges (paths), grouping (the sealed enclosure ring), labels,
sublabels, legend, evidence state, and a failure mode — all from the closed
primitive set.

### C.3 Interaction and keyboard specification

Reuses the incumbent `InteractiveFlowDiagram` interaction model, which is
already correct and must not be re-invented:

| Interaction | Requirement |
|---|---|
| Explore a zone | Hover **and** focus, both producing identical results |
| Keyboard | Each zone is `tabIndex={0}` with a descriptive `aria-label` |
| Description surface | Real DOM region with `aria-live="polite"`, never a pointer-only tooltip |
| Mode toggle | Normal / failure, via existing `DiagramControls` |
| Replay | Remounts the sequence; the control itself never loses focus |
| Focus visible | Inherits `--focus`; never removed |

### C.4 States

| State | Behaviour |
|---|---|
| Rest | Full static plate, all labels present |
| Hover / focus | Explored zone emphasised; unconnected zones and edges dim |
| Selected | Same as focus; selection is not a separate mode |
| Failure | Failure edge revealed in `--diagram-failure`; sanctioned path dims |
| Error / missing spec | Renders nothing rather than a broken frame; never a broken-image box |
| Reduced motion | Identical content, no draw sequence, no packets |

### C.5 Text equivalent

`<title>` + `<desc>` via `aria-labelledby`, plus the always-present explore
panel. Dimming is a visual emphasis only — no information is conveyed by
dimming alone.

### C.6 Deterministic geometry

Layout is computed from the spec by pure functions: zone count and archetype
determine coordinates. Same spec ⇒ identical geometry, every build. No random
placement, no layout engine, no runtime measurement.

---

## D. Social card pilot — `s41.11`

### D.1 Template

Reusable across the whole catalog, not a one-off:

```
┌──────────────────────────────────────────┐
│ SECURITYCORP        PILLAR / CATEGORY    │  mono, --plate-legend
│ ────────────────────────────────────────  │
│                                          │
│   [ plate composition, archetype-driven ] │
│                                          │
│ ────────────────────────────────────────  │
│ Article Title, up to three lines          │  display
│ [EVIDENCE]   N CLAIMS   N MIN READ        │  mono
└──────────────────────────────────────────┘
```

### D.2 Dimensions and aspect ratios

| Target | Size | Ratio |
|---|---|---|
| Open Graph (`og:image`) | 1200×630 | 1.91:1 |
| Twitter `summary_large_image` | 1200×630 | 1.91:1 |

One asset satisfies both. `og:image:width` / `og:image:height` must be declared
so previews reserve space.

### D.3 Title length handling

| Length | Treatment |
|---|---|
| Short (≤ 28 chars) | 46px display, one line, plate gets more vertical room |
| Medium (29–60) | 46px, two lines |
| Long (61–90) | 38px, three lines |
| Very long (> 90) | 38px, three lines, **truncated on a word boundary with an ellipsis** |

Truncation is deterministic and word-boundary based — never mid-word, never a
shrink-to-fit loop.

### D.4 Legibility at preview size

Cards are frequently rendered near 240px wide in feeds. Minimum effective type
is therefore the constraint: nothing below 38px at 1200px wide, which holds at
roughly 7.6px effective. Plate labels drop to short codes on the card, matching
the `< 768px` density rule.

### D.5 Fallbacks

| Condition | Output |
|---|---|
| Article has a plate spec | Plate composition |
| Article has a legacy raster cover | That cover, cropped to its recorded `focalPoint` |
| Article has neither | **Typographic-only card** — title, pillar, evidence badge, no artwork. Never a broken image, never a generic stock graphic. |

### D.6 Privacy

No private metadata is embedded. The card carries only already-public article
metadata: title, pillar, category, evidence state, reading time. No author
email, no internal path, no build host, no repository identifier. Raster output
has metadata stripped on export.

### D.7 Build compatibility

Static export has no runtime image service, so cards are rasterised at build
time from the same plate source via the pinned `sharp@0.35.4`. Deterministic:
same spec + same tokens ⇒ same bytes. Social cards use fixed light-on-dark
values rather than live CSS variables, because the rasteriser has no theme
context — this is the one deliberate exception to token-only rendering, and it
is confined to raster export.
