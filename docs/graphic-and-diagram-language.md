# Graphic, Illustration and Diagram Language

Bead: `securitycorp-source-s41.7`. Status: implementation-ready specification.
Depends on `s41.6` (code-native design system) and the `s41.5` direction
decision (B + C hybrid; A retained for existing brand moments only).

Companion policy: [`docs/article-visual-guidelines.md`](article-visual-guidelines.md)
remains authoritative for cover policy, briefs and migration state. This
document defines the *visual language* those briefs are written in.

---

## 1. Medium selection — when to use what

| Medium | Use for | Never use for |
|---|---|---|
| **Code-native SVG** (default) | Article covers, technical diagrams, catalog thumbnails, teaching figures, evidence badges | — |
| **Build-time raster** (`sharp` from SVG) | Social cards only (1200×630), because static export has no runtime image service | In-page content |
| **CSS-generated** | Ambient page atmosphere already in `globals.css` (`--ambient-*`, `--grid-line`) | Anything carrying meaning |
| **Existing components** | `InteractiveFlowDiagram`, `DiagramControls`, `ArticleFigure` | — |
| **Externally generated raster** | **Frozen.** The three approved legacy covers only. No new ones during this pilot. | New catalog covers |

**The decisive rule:** anything that carries a factual label, command, protocol
detail or comparison is code-native. Generated raster art never carries factual
content (`docs/article-visual-guidelines.md`).

---

## 2. Shape language

- **Rectilinear.** Zones are rectangles with square corners. The 9px/16px clip
  belongs to page chrome, not to plate internals.
- **Line weights:** hairline `1px` structure; `1.6px` sanctioned path; `3px`
  high-volume path; `1.8px` sealed boundary ring; `0.8px` outer registration frame.
- **Paths connect or they do not.** A sanctioned relationship is a stroke that
  visibly terminates on both zones. An absent relationship is *empty space* —
  never a dashed "weak" line, which reads as "partial" and is a different claim.
- **The sealed boundary is an unbroken ring with zero paths touching it.** This
  is the single most load-bearing convention in the whole language; it is what
  the first approved cover established and what the segmentation-vs-isolation
  thesis depends on.
- **Ticks and registration marks** on plate edges signal "instrument", not
  decoration. Four edges, evenly spaced, `--plate-tick`.

## 3. Palette and semantics

| Colour | Token | Means |
|---|---|---|
| Cyan | `--acid` | Sanctioned, permitted, observed, in-coverage |
| Violet | `--accent2` | Exception, sealed, out-of-coverage, blind spot |
| Green | `--go` / `--evidence-validated` | VALIDATED evidence state |
| Amber | `--warn` / `--evidence-unverified` | UNVERIFIED, failure mode, partial |
| Red | `--danger` | Missed, denied, broken |
| Navy tonal | `--paper` → `--surface-raised` | Ground and structure |

Cyan and violet are **not decorative accents**; they are a two-term semantic.
Using violet for "a second nice colour" breaks the entire catalogue's meaning.

**Colour is never the only channel.** Every semantic distinction must also be
carried by geometry or stroke pattern (see §6 fallbacks and s41.6 §6).

## 4. Texture, glow, depth

- **Texture: none.** Flat vector. The absence is the statement — this is a
  drafted plate, not a render.
- **Glow: none** on plates. `--glow` stays for incumbent hero/UI use only.
- **Depth: tonal layering only.** One step per layer, navy on navy. No
  perspective, no shadow, no blur, no reflected floor. (Those belong to the
  retained legacy A covers, which is precisely why the two read as different
  eras and must be framed identically to coexist deliberately — §9.)

## 5. Composition archetypes

Five archetypes, chosen so 39 covers do not become wallpaper. Each is
*materially* different in silhouette, not a recolour.

| # | Archetype | Silhouette | Says |
|---|---|---|---|
| 1 | **Linear Flow** | Equal zones left→right, connected | Traffic progresses through stages |
| 2 | **Sealed Enclosure** | Cluster + one ringed outlier, asymmetric negative space | One thing is deliberately unreachable |
| 3 | **Coverage Field** | A plane split by a lit boundary; covered vs uncovered | Something sees only part of the space |
| 4 | **Gate Sequence** | Stacked parallel planes crossed by a path bundle; one path terminates | Layered checks, one of which stops something |
| 5 | **Divergent Pair** | Two parallel tracks, same origin, different outcome | Two options that are not equivalent |

### 5.1 Composition selection is structural, not random

Selection is a deterministic function of the article's own structure, so the
same article always yields the same archetype and review is reproducible.
Priority order, first match wins:

1. Article declares an explicit `plate.archetype` in its spec → use it.
2. Article's thesis is a two-option comparison (`title`/`summary` contains a
   comparison construction, or `contentType: "comparison"`) → **Divergent Pair**.
3. Article is about what a control/tool fails to see (coverage, limits, gaps,
   blind spots) → **Coverage Field**.
4. Article is about sequential checks, approvals or pipeline stages →
   **Gate Sequence**.
5. Article is about isolation, least privilege, or an unreachable plane →
   **Sealed Enclosure**.
6. Default → **Linear Flow**.

A hash of the slug may vary *non-semantic* parameters only — zone count within
the archetype's legal range, tick phase, minor spacing. It must never choose the
archetype itself. Decorative randomness is prohibited.

## 6. Mandatory text/table fallback

Every technical diagram and plate MUST provide an equivalent non-visual reading:

- `<title>` and `<desc>` on the SVG, referenced by `aria-labelledby`.
- A real, always-in-the-DOM description region (the existing
  `.diagram-explore-panel` pattern) — never a pointer-only tooltip.
- For coverage matrices and comparison figures, the underlying data must also be
  reachable as a **semantic table or list** in the DOM, not only as positioned
  SVG text.
- Reduced-motion and no-JS states render the full content.

## 7. Surface-by-surface language

| Surface | Language |
|---|---|
| **Article cover** | One plate, one archetype, ≤ 4 labelled zones, legend at ≥ 768px |
| **Social card** | Same plate, 1200×630, plus title plate + evidence badge |
| **Catalog thumbnail** | Same plate, short labels, no legend, no sublabels |
| **Technical diagram** | Same vocabulary, interactive: mode toggle, replay, explore panel |
| **Evidence badge** | Mono uppercase, 1px border in the evidence token, never a filled block |
| **Warning / safety notice** | Existing callout pattern (violet left border); plates never encode a warning by colour alone |
| **Learning track** | Gate Sequence archetype at track level; steps are zones |
| **Decorative section art** | **Prohibited.** If it carries no meaning it does not ship. |

## 8. Source, provenance, export

Code-native assets are their own editable source — the per-article spec **is**
the source file, versioned in git, diffable in PRs, regenerable forever. This is
the principal advantage over the legacy raster pipeline.

| Requirement | Rule |
|---|---|
| Editable source | The typed spec in `lib/articles/<slug>.ts`; no binary masters |
| Filenames (social) | `<slug>-card.webp` under `public/article-visuals/` |
| Dimensions | Social 1200×630; legacy covers remain 1600×900 |
| Export format | WebP, quality tuned to ≤ 200 KB |
| Metadata | Stripped on export (existing `scripts/normalize-cover-source.ts` behaviour) |
| Responsive crops | Plates scale; they never crop. `focalPoint` remains meaningful only for legacy raster cards |
| Licensing | Original work, authored in-repo; no third-party asset licences introduced |
| Provenance | Recorded in the existing `ArticleVisual.provenance` record, with `generator: "code-native"` |
| Reproduction | Deterministic: same spec + same tokens ⇒ byte-identical SVG. No prompts required, and none are recorded, because nothing external generates these. |

The legacy A covers keep their existing provenance records unchanged, including
their recorded external generation method and human approval
(Ravi Teja Thota, 2026-09-05). Do not rewrite their provenance.

## 9. Making legacy and new coexist deliberately

The three retained cinematic covers sit on articles that also receive new
plates. They must read as an intentional earlier series, not as leftovers:

- **Identical outer framing.** Same container, same border treatment, same
  corner clip, same width and vertical rhythm as a plate.
- **Identical caption and credit typography**, same spacing scale.
- **Identical metadata conventions** — same `ArticleVisual` shape, same
  caption/alt discipline.
- The legacy cover keeps the cover slot; the new plate appears as the article's
  in-body diagram. One article, two eras, one frame.

## 10. Review checklist — avoiding generic AI cyberpunk imagery

A plate or figure fails review if any is true:

- [ ] It would fit ten unrelated articles without modification.
- [ ] It contains a padlock, shield, hooded figure, screen-of-code, matrix rain,
      glitch text, skull, magnifying glass or generic HUD chrome.
- [ ] It uses glow, bloom, lens flare or a purple-to-blue gradient.
- [ ] It uses violet for anything other than the exception/sealed semantic.
- [ ] Its meaning survives only in colour (fails greyscale/forced-colors).
- [ ] A reader could not roughly guess the article's topic from it.
- [ ] It carries a factual label not supported by the article's cited sources.
- [ ] It contains any real hostname, address, credential, product name from a
      private environment, internal path, or employer detail.
- [ ] It is decorative and carries no meaning.

## 11. Editorial status of plate text

**Any label, evidence state, comparison or claim rendered in a plate or figure
is public editorial content.** Code-native generation makes it reviewable and
regenerable; it does not make it approval-free. Such text must:

- match the article's actual thesis;
- be supported by the article's cited sources;
- pass technical, privacy, public-terms, accessibility and publication-safety
  review;
- never use illustrative placeholder claims in production;
- follow the repository's Ruflo editorial-routing policy, with a stalled 0%
  workflow explicitly **not** counting as approval.
