---
name: article-visuals
description: Use when a knowledge-base article needs a cover/hero visual or an in-body teaching illustration — deciding whether a visual is warranted, choosing its type, writing its brief, verifying its factual content, producing or specifying the asset, and getting it through accessibility, optimization, browser QA, provenance, and human approval. Not for the existing interactive-diagram mechanism (components/diagrams/), homepage hero work, or OG/social-image generation (separate scope).
version: 1.0.0
user-invocable: true
license: Apache 2.0
---

This skill is the workflow companion to
[docs/article-visual-guidelines.md](../../../docs/article-visual-guidelines.md)
(policy — read it first, it is not repeated here) and
[lib/article-visuals.ts](../../../lib/article-visuals.ts) (the type-safe
data shape). Keep the three separated: this file says *how*, the guide
says *what's allowed*, the module says *what it's shaped like*.

## 1. Article analysis

Read the full article before deciding it needs a visual. Identify:

- Its central, distinguishing thesis — the one claim that separates it
  from ten other articles on adjacent topics. A cover brief anchors on
  this, never on the topic label alone ("network security" is not a
  thesis; "segmentation limits blast radius but isolation is what
  actually stops lateral movement" is).
- Whether it already has `article.diagram` (check the source file under
  `lib/articles/`). If it does, that satisfies the "teaching visual"
  need in most cases — do not duplicate it with a second illustration
  unless a genuinely different point needs showing.
- Whether any section describes a workflow, boundary, comparison, or
  spatial relationship that reads harder in prose than it would drawn.
  If nothing does, the article may only need a cover, or nothing new at
  all — don't force a visual in.

## 2. Visual-archetype selection

Pick the visual type from what the thesis actually needs, not from a
default:

- **Cover/hero** — one per article, sets tone and signals the article's
  distinguishing idea at a glance. Does not need to be literal.
- **In-body illustration** — only when a specific passage is genuinely
  harder to understand without it. One or two per article, maximum.
- Prefer the existing diagram mechanism (`components/diagrams/`, driven
  by `article.diagram`) over a new raster illustration whenever the
  content is a relationship, flow, or structure — it's interactive,
  accessible by construction, and already reviewed. Reach for a raster
  `ArticleVisual` only for the cover, or for illustration that's
  genuinely painterly/conceptual rather than diagrammatic.

Reject any concept that would still make sense with the article's title
swapped for a different one. Re-read
`docs/article-visual-guidelines.md`'s "main visual model" section before
finalizing a concept — it lists the specific generic-imagery bans.

## 3. Briefing

Fill every field of `VisualBrief` (see the guide's brief-template table
for the full field list and order). Non-negotiables:

- `factualClaims[].source` must point to something the article itself
  cites — never invent a citation to justify a visual detail. If a
  detail in the brief needs sourcing and the article doesn't cite
  anything for it, either find the article's own basis for the claim
  (its prose, its own `references`) or drop the detail from the brief.
- `mustNotShow` always includes: real hostnames/IPs/credentials/tokens/
  PII/identifiable screenshots, and the generic-imagery list from the
  guide (stock hacker, hooded figure, generic padlock, random code
  screen, meaningless HUD, excessive glow).
- `mobileCropNotes` must say what survives a narrow crop — a cover that
  only reads correctly at wide desktop size is an incomplete brief.

## 4. Factual verification

Before finalizing a brief with any factual content (a claimed
relationship, a labeled comparison, a depicted sequence), re-read the
article passage it's drawn from and confirm the visual doesn't overstate,
simplify past correctness, or contradict it. This is the same discipline
`docs/publication-safety-policy.md` and the citation-verification script
already apply to prose — a visual is not exempt because it's not text.

## 5. Creation

Check `docs/article-visual-guidelines.md`'s "Capability status" section
for the current state of image-generation tooling in this repo before
assuming one is available — do not install a new MCP server, plugin, or
external service to acquire one; that requires explicit user
authorization first, and a stalled/empty/pending workflow is never
treated as capability.

- **No generation capability available**: stop at `stage: "brief"`. The
  brief itself is the deliverable — complete enough that generation can
  happen directly from it later, with the `mustShow`/`mustNotShow`/
  composition/crop fields as the generation contract. Do not create a
  placeholder image and present it as final.
- **Capability available and approved**: generate from the stored brief
  verbatim, save the editable source (the prompt/seed for an AI
  generator, or the source file for a hand-illustrated/vector asset)
  under a real `editableSourceRef`, and set `stage: "asset"`.

## 6. Accessibility

- `alt` is required, non-empty, describes what the image actually shows
  (not the filename, not "image of..."), and is never a restatement of
  the caption. `components/article-figure.tsx` throws if `alt` is
  empty — this is enforced, not just documented.
- A card thumbnail reusing the same asset gets `alt=""` (decorative —
  the card's own heading already names the link); the meaningful alt
  text lives once, on the full-size `ArticleFigure`.
- If `enlargeable`, confirm keyboard operation: the trigger is a real
  `<button>`, the enlarged view is a native `<dialog>` (browser-native
  focus trap and Escape-to-close — do not hand-roll a modal), and focus
  visibly lands on the close button on open.
- Confirm `prefers-reduced-motion` is respected (the only motion here is
  a `.15s` opacity transition, already gated) and that print output
  doesn't clip or waste a page on interactive-only chrome.

## 7. Optimization

- Explicit `width`/`height` on every `<img>` (prevents CLS) — required
  by `ArticleFigure`'s props, not optional. Set the specific asset's
  real dimensions, not placeholder defaults.
- Raster budget: 400KB per asset (`MAX_RASTER_BYTES` in
  `scripts/check-article-visuals.ts`). Prefer AVIF/WebP export formats.
- SVG assets must not contain `<script>`, inline event-handler
  attributes, external `xlink:href` references, or XML entities — the
  audit script rejects these; write clean, static SVG.

## 8. Browser QA

Render the article/card at ~375px, ~768px, and ~1440px, in both
manually-toggled light and dark themes, and check: no horizontal
overflow or clipping, no unexpected layout shift, focus is visible when
tabbing to an enlargeable figure, diagram/caption text stays readable at
each width. If no browser-automation tool is available in this
environment to capture real screenshots, say so explicitly in the final
report rather than fabricating visual verification — a disclosed gap is
correct; a claimed-but-undone check is not.

## 9. Provenance

Fill every `VisualProvenance` field (see the guide's Provenance
section). Two hard rules the type doesn't fully enforce on its own:

- Never write `reviewStatus: "approved"` yourself. That field is for a
  named human reviewer (in practice, Ravi Teja Thota) to set — an agent
  self-approving its own design output defeats the purpose of having a
  review field at all.
- `source: "ai-generated"` requires `generatingModel` and `prompt` (and
  `seed` if the generator produced one) once past `stage: "brief"` — an
  asset with no way to reproduce or audit it is not acceptable
  provenance.

## 10. Human approval

Finish every pass by running `npm run check:article-visuals` (and the
rest of the standard validation suite — lint, typecheck, test,
build) before presenting work. Do not merge or deploy a material visual
change without Ravi's explicit approval of the visual direction — leave
the PR open and ask directly: approve, revise, or reject. This applies
even under a standing publication authorization; a visual gate absent
from the standing policy's list of passed gates is not implicitly
covered by it.
