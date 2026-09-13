# Code-Native Design System

Bead: `securitycorp-source-s41.6`. Status: implementation-ready specification.
Authority: the visual direction selected by Ravi Teja Thota in `s41.5`
(2026-09-13) — a defined **B + C hybrid**, with A retained for existing brand
moments only.

This document **specifies**; it does not modify production code. It records
what the system already is, what is missing, and the rules that stop one-off
styling from bypassing it.

> **This is not a redesign.** `app/globals.css` is the source of truth and
> stays the source of truth. Regenerating the design system, replacing the
> palette, or replacing the typography is explicitly prohibited without
> separate authorization from Ravi (CLAUDE.md, DESIGN.md Don'ts).

---

## 1. Semantic tokens, not page-specific values

Every token below is already declared in `app/globals.css` unless marked
**GAP**. Components must consume the semantic name, never the literal hex.

### 1.1 Fixed tokens (identical in both themes)

These stay dark regardless of active theme, because code and a few inverted
surfaces are deliberately theme-independent.

| Token | Role |
|---|---|
| `--night` | Inverted ground; code-block background |
| `--white` | Inverted foreground base |
| `--inverted-foreground` / `--inverted-muted` / `--inverted-border` | Text and edges on inverted surfaces |
| `--inverted-primary` | Accent on inverted surfaces |
| `--code-background` / `--code-foreground` | Code blocks |

### 1.2 Themed palette

Declared for dark at `:root`, re-declared for light at `:root[data-theme="light"]`.

| Token | Dark | Light | Role |
|---|---|---|---|
| `--paper` | `#070b12` | `#f5f7fa` | Page ground |
| `--ink` | `#e8f1f8` | `#10192b` | Body text |
| `--muted` | `#93a6b9` | `#5a6478` | Secondary text |
| `--line` | `#1b2836` | `#dbe1e9` | Hairline borders |
| `--border-strong` | `#2c3f52` | `#c7cfda` | Emphasised borders |
| `--surface-raised` | `#121c2b` | `#eef1f6` | Raised panels, cards |
| `--background-subtle` | `#0a0f18` | `#eef2f7` | Recessed bands |
| `--acid` | `#00e5ff` | `#0a5fb4` | Primary signal / sanctioned path |
| `--accent2` | `#8b5cf6` | `#6a45d1` | Exception / sealed boundary |
| `--go` / `--warn` / `--danger` | `#33ff99` / `#f5b942` / `#ff6b6b` | `#157a4a` / `#a8600a` / `#c92a2a` | Semantic status |
| `--glow`, `--ambient-1`, `--ambient-2`, `--grid-line` | rgba | rgba | Atmosphere, restrained |

**The light values are not naive inversions** — `--acid` shifts from cyan to a
darker blue (`#0a5fb4`) specifically to hold contrast on a light ground. Any
new token must be declared in *both* blocks or it will break one theme.

### 1.3 Diagram tokens (already present — the plate system inherits these)

| Token | Maps to |
|---|---|
| `--diagram-node-bg` | `--surface-raised` |
| `--diagram-node-border` | `--line` |
| `--diagram-node-text` | `--ink` |
| `--diagram-line` | `--acid` |
| `--diagram-failure` | `--warn` |

### 1.4 GAP — tokens the Schematic Plate requires

These do **not** exist yet and must be added to both theme blocks. They are
semantic aliases over existing values; they introduce no new colour.

| New token | Dark source | Light source | Role |
|---|---|---|---|
| `--plate-frame` | `--line` | `--line` | Outer registration frame |
| `--plate-tick` | `--border-strong` | `--border-strong` | Edge tick marks |
| `--plate-zone-bg` | `#0e1a28` | `--surface-raised` | Zone fill |
| `--plate-zone-border` | `#2a4a63` | `--border-strong` | Zone edge |
| `--plate-zone-cap` | `--acid` | `--acid` | Zone header rule |
| `--plate-sealed` | `--accent2` | `--accent2` | Sealed / no-path boundary |
| `--plate-label` | `--ink` | `--ink` | Primary plate label |
| `--plate-label-dim` | `--muted` | `--muted` | Secondary plate label |
| `--plate-legend` | `--muted` | `--muted` | Legend text |
| `--evidence-validated` | `--go` | `--go` | Evidence state: VALIDATED |
| `--evidence-design-only` | `--accent2` | `--accent2` | Evidence state: DESIGN ONLY |
| `--evidence-unverified` | `--warn` | `--warn` | Evidence state: UNVERIFIED |

`--plate-zone-bg` is the only genuinely new literal in dark (`#0e1a28`), a tonal
step between `--paper` and `--surface-raised`. If that is judged unnecessary,
alias it to `--surface-raised` instead; do not invent a third value.

---

## 2. Typography

Self-hosted via `next/font` in `app/layout.tsx`, exposed as `--font-sans-nf` /
`--font-mono-nf` with system fallbacks in `--font-sans` / `--font-mono`.
`--font-serif` exists but is not used by the plate system.

| Role | Family | Treatment |
|---|---|---|
| Body | `--font-sans` | Existing article hierarchy, ≤ 900px measure |
| Plate labels | `--font-mono` | Uppercase, `letter-spacing: .06em–.1em` |
| Legends, ticks, revision marks | `--font-mono` | Smaller step, `--plate-legend` |
| Evidence badges | `--font-mono` | Uppercase, bordered |

**Plate type scale** (SVG user units, viewBox `0 0 800 300`): zone label 11,
zone sublabel 9, legend 8.5, plate header 9. Below 8.5 is prohibited — see
§5 for the responsive rule that enforces it.

**GAP:** `components/diagrams/interactive-flow-diagram.tsx` hardcodes
`fontFamily="Arial, Helvetica, sans-serif"` on node text (line 165), covered by
a narrow file-scoped waiver in `.impeccable/config.json`. New plate code MUST
NOT copy that; it uses `--font-mono`. The incumbent waiver stays until a
human-approved typography change, per the waiver's own stated reason.

---

## 3. Shape, spacing, elevation

- **Clipped corners** are the signature: `.clip-corner` (16px) and
  `.clip-corner-sm` (9px). One clip per surface; never nested.
- **Radii:** `rounded.sm = 9px` (DESIGN.md). Existing diagram nodes use `rx=6`.
  Plate zones use square corners — rectilinear geometry is the B grammar.
- **Page spacing:** `clamp(22px, 5vw, 76px)`.
- **Elevation** comes from tonal navy layering, thin borders and restrained
  cyan edge light. Broad blur, new shadow systems and gratuitous glow are
  prohibited (DESIGN.md). The plate system uses **no shadow at all**.
- **Borders:** hairline `1px` on `--line`; emphasis via `--border-strong`, never
  via thickness above 2px except the sealed boundary (1.8px on `--plate-sealed`).

---

## 4. Motion tokens and behaviour

The repository's motion posture is **opt-in**: nearly all motion sits inside
`@media(prefers-reduced-motion:no-preference)`, so the reduced-motion state is
the *default* rendering, not a stripped-down fallback. The plate system must
preserve this inversion.

| Rule | Requirement |
|---|---|
| Resting state | Static. The plate is fully legible with zero animation. |
| Optional motion | User-triggered only (replay / mode toggle), never ambient, never autoplay-on-scroll. |
| Reduced motion | Content is never gated behind an animation. All labels present at first paint. |
| Hover | May enhance, must never be the only way to reach information (PRODUCT.md). |

`components/motion-controller.tsx` + `reobserveMotionElement()` is the existing
mechanism; reuse it rather than adding a second motion system.

---

## 5. Responsive behaviour

Breakpoints in use: `901px` (pointer-fine interactions), plus the article
shell's own fluid padding.

**The plate rule — label density steps, type does not shrink:**

| Width | Plate behaviour |
|---|---|
| ≥ 1024px | Full labels, sublabels, legend, ticks, revision mark |
| 768–1023px | Full labels, sublabels; legend collapses to swatches |
| < 768px | Labels drop to short codes (≤ 4 chars); sublabels and legend hidden; zones may reflow to a 2×2 grid |

Type size is **constant** across breakpoints. Shrinking labels below 8.5 user
units to fit is prohibited — that is the documented failure mode of scaled-down
schematics. Density steps down instead.

Wide figures (coverage matrices) get their own `overflow-x: auto` container so
the page body never scrolls horizontally.

---

## 6. High contrast, forced colors, print

**GAP — no `prefers-contrast` or `forced-colors` block exists** in
`app/globals.css` today (verified by grep; only `prefers-reduced-motion` and
`@media print` are present at line 839). s41.6 acceptance requires covering
high-contrast behaviour, so this is recorded as a genuine gap rather than
silently skipped.

Required for the plate system:

- Under `forced-colors: active`, plate strokes must use `CanvasText`/`LinkText`
  system colours rather than disappearing; set `forced-color-adjust: auto` and
  avoid conveying meaning by fill alone.
- **Never encode meaning by colour alone.** Sanctioned vs sealed must also
  differ by *stroke pattern and geometry* (solid path that connects vs. an
  unbroken ring with no path touching it). This is already how the approved
  cinematic covers work, and it is what makes the plates survive high-contrast,
  greyscale print, and colour-blind readers.
- Print: plates must render legibly on the existing monochrome print stylesheet.

Filing this gap as its own bead is recommended rather than folding an
accessibility-infrastructure change into the pilot PR.

---

## 7. Component inventory and controlled variants

Existing, reusable, and in scope for the plate/figure work:

| Component | Reuse posture |
|---|---|
| `components/diagrams/interactive-flow-diagram.tsx` | **Extend, do not fork.** Its spec-driven, closed rendering model is the precedent. |
| `components/diagrams/diagram-controls.tsx` | Reuse verbatim for mode/replay. |
| `components/article-figure.tsx` | Cover/figure slot with caption + credit. |
| `components/figure-enlarge-trigger.tsx` | Existing enlarge affordance. |
| `components/knowledge-article-shell.tsx` | Cover slot, evidence badge, numbered sections, TOC. |
| `components/knowledge-catalog-filter.tsx` | Card thumbnails (`toCard()` in `lib/knowledge-catalog.ts`). |
| `components/motion-controller.tsx` | The only motion system. |

Controlled variants — the plate renderer exposes exactly these and no free-form
styling hooks: `archetype`, `density`, `theme-aware colour role`
(`sanctioned` | `sealed` | `neutral` | `failure`), `evidence state`, and
`label mode` (`full` | `short`).

---

## 8. Rules that prevent bypassing the system

1. **No literal colours in component code.** Every fill/stroke resolves to a
   `var(--token)`. The Impeccable detector enforces this; existing waivers in
   `.impeccable/config.json` are narrow, file-scoped and must not be widened.
2. **No new dependencies.** The plate system is plain TSX + SVG. `sharp` (already
   pinned at 0.35.4) is the only rasteriser, used at build time only.
3. **Closed rendering model.** No `dangerouslySetInnerHTML`, no interpolation of
   caller strings into `d=` path data or style attributes. Specs are typed data;
   the renderer maps them to elements. All text is rendered as JSX children so
   React escapes it.
4. **One system for covers, diagrams, catalog thumbs and social cards.** A second
   visual system is the failure this direction exists to prevent.
5. **`VISUAL_GATE_ENABLED` stays `false`** (`lib/article-visuals.ts:300`). Nothing
   in this pilot flips it.
6. **Agents never self-approve visuals.** `stage: "reviewed"` and
   `reviewStatus: "approved"` are for a named human reviewer only, enforced by
   `checkAssetApprovalGate` at CI.

---

## 9. Social-card primitive

Static export for Cloudflare Pages means there is no runtime image service. Social
cards are therefore **build-time rasterised** from the same plate source via
`sharp`, not generated per request. One renderer, two outputs:

| Output | Size | Path |
|---|---|---|
| In-page plate | fluid SVG | inline, themed |
| Social card | 1200×630 | build-time WebP/PNG |

The social card adds only a title plate and evidence badge over the plate
composition; it never introduces separate artwork.
