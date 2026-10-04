# Article cover batch 1

Status: **Reviewed by Ravi Teja Thota on 2026-09-27** (recorded in
`securitycorp-source-d4e`):

| Article | Owner decision | State |
|---|---|---|
| `segmentation-vs-isolation` | Plate APPROVED | Integrated in `lib/article-plates.ts`; approval in `PLATE_APPROVALS` |
| `dependency-confusion-package-trust` | Plate APPROVED | Integrated; approval recorded |
| `turning-attack-hypothesis-into-detection` | Plate APPROVED | Integrated; approval recorded |
| `cloud-iam-permission-creep` | HOLD: concept approved in principle; not approved or integrated until s41.22 is fixed and a corrected render is re-reviewed | Not registered; corrected previews prepared |
| `backup-restoration-verification` | APPROVED TO GENERATE ONE CANDIDATE from the brief below. This is **not** approval of any resulting image | Candidate pending; any asset enters at `stage: "asset"`, `reviewStatus: "pending"` |

The three integrated specs are byte-identical to the reviewed appendix. The
only rendered difference is the s41.22 renderer fix, which moves the
divergent-pair bottom track 10 px up so it clears the legend rule. Labels,
roles, links, and captions are unchanged.

The original proposal follows, as reviewed. Policy: hybrid cover model, decision
`securitycorp-source-s41.21`; see `docs/article-visual-guidelines.md`.
Tracking bead: `securitycorp-source-d4e`. Prepared 2026-09-27 on branch
`policy/article-visual-workflow` after commit `7f2493f`.

Exactly five published articles, none of which has a canonical cover today
(`npm run report:article-visuals`). They were chosen to cover five areas and
five different cover treatments:

| # | Article | Area | Pillar / category | Treatment | Archetype | Teaching figure |
|---|---|---|---|---|---|---|
| 1 | `segmentation-vs-isolation` | Network / architecture | defend-systems / network-security | **SCHEMATIC PLATE** | Divergent Pair | Present (interactive diagram) |
| 2 | `dependency-confusion-package-trust` | Application / supply chain | build-securely / application-code-security | **SCHEMATIC PLATE** | Gate Sequence | Present (interactive diagram) |
| 3 | `cloud-iam-permission-creep` | Identity / access | defend-systems / cloud-security | **SCHEMATIC PLATE** | Coverage Field | None. Recommended (proposal) |
| 4 | `turning-attack-hypothesis-into-detection` | Threat / detection / response | detect-respond / detection-engineering | **SCHEMATIC PLATE** | Linear Flow | None. Optional (proposal) |
| 5 | `backup-restoration-verification` | Governance / risk / resilience | defend-systems / security-architecture | **RASTER / EDITORIAL** | Editorial (no plate archetype) | None. Recommended (proposal) |

The formats were not chosen to a quota. Four articles have a clear structural
thesis that a plate states more precisely than artwork could. The backup
article's thesis is a gap between a signal and a proven state, and a plate
would reduce that to a generic four-box checklist, so it is the one raster
candidate. The teaching-figure column records current state and a proposal
only. It is not written to `TEACHING_FIGURE_ASSESSMENTS`, because only a
human records those.

Preview renders of the four plates were made with the production
`PlateFigure` component and built CSS, at 1200 px and 390 px in dark and
light themes. They are review aids only and are not committed. All four
specs pass `validatePlateSpec` (zone ranges, label fit, the sealed-zone rule)
and the `privacy-leak-gate` text scanner.

Selection rationale for the archetypes: rule 2 of
`graphic-and-diagram-language.md` §5.1 gives #1 Divergent Pair (comparison
title), and rule 3 gives #3 Coverage Field (what a point-in-time review cannot
see). #2 and #4 declare an archetype for thesis accuracy (priority 1), which
also avoids repeating Divergent Pair. The pilot already has two divergent
pairs.

---

## 1. Segmentation vs Isolation: SCHEMATIC PLATE

- **Pillar / category:** defend-systems / network-security. Evidence state:
  UNVERIFIED (rendered by the shell, not encoded in the plate).
- **Archetype:** Divergent Pair. The title is a two-option comparison.
- **Why a plate:** the thesis is topological. A controlled path exists or
  no path exists. The plate language already encodes that exactly: a
  sanctioned stroke versus a sealed ring that nothing touches, where an
  absent relationship is empty space. Artwork would add nothing and risks a
  generic "network" image.
- **Concept:** one origin (shared services) with two tracks. The top track
  runs through a segmentation gateway to the finance zone on a filtered,
  logged path. On the bottom track, a legacy control zone sits in a sealed
  ring with no path at all.
- **Technically important:** the isolated zone must have *no* link. It must
  not be a dashed or "denied" link, because a denied rule and a nonexistent
  route are different evidence (article key takeaway 3). The gateway carries
  the "filtered, logged" qualifier.
- **Must not show:** a firewall or padlock icon; a dashed line to the
  isolated zone; any port or protocol numbers; real zone or host names.
- **Composition:** it differs deliberately from the existing
  `understanding-network-trust-boundaries` Sealed Enclosure plate (cluster
  plus outlier), because those two articles are companions.
- **Crop / safe zone:** plates scale and never crop. At a width under
  768 px, the short labels are SHARE / GWAY / FIN / LEGCY. The catalog
  thumbnail uses the same plate in compact form.
- **Alt concept:** uses the spec `desc`: "A shared services zone reaches a
  finance zone through a segmentation gateway, on a controlled, filtered
  path ... a legacy control zone is enclosed by an unbroken boundary: no
  route to it was ever built."
- **Sources for plate text:** the article's own diagram spec (shared
  services → segmentation gateway → finance; legacy control zone isolated),
  `executiveSummary`, and `keyTakeaways`.
- **Teaching figure:** present. The plate goes in the cover slot, and the
  interactive diagram stays in-body.

## 2. Dependency Confusion and Package-Name Trust: SCHEMATIC PLATE

- **Pillar / category:** build-securely / application-code-security.
- **Archetype:** Gate Sequence, declared. The article's control story is a
  resolution gate: scope mapping plus a single authoritative registry. The
  existing interactive diagram already shows the attack as a divergent
  path, so the cover shows the gate that closes it.
- **Why a plate:** the thesis is a resolution-order failure. That is
  structural and label-dependent, and raster art cannot carry the labels.
- **Concept:** four gates run left to right: Install request (internal name)
  → Package manager → Scope mapping (one per name) → Internal registry. A
  sealed "Public lookalike: never consulted" zone at the end has no path to
  it, because resolution fails rather than falling through.
- **Technically important:** the fix is named as *scope mapping to one
  authoritative source*, not "scanning". The article explicitly says no
  scan catches a resolution decision. The lookalike carries no link.
- **Must not show:** the fictional registry hostname from the article, any
  real package or registry names, npm or pip logos, a "malware" skull, or a
  version number.
- **Crop / safe zone:** plate, so no crop. Short labels are REQ / PKGM /
  SCOPE / INT / LOOK.
- **Alt concept:** uses the spec `desc` (install request → package manager →
  scope mapping → internal registry, with the public lookalike never
  consulted).
- **Sources:** `executiveSummary`, `mainContent` ("ambiguous authority, not
  a missing scan"), `defensiveRecommendations` 1–2, and the diagram caption.
  Cited basis: npm scopes documentation, pip `--extra-index-url`
  documentation, and CWE-1357.
- **Teaching figure:** present (the interactive normal/failure diagram).

## 3. Cloud IAM Permission Creep: SCHEMATIC PLATE

- **Pillar / category:** defend-systems / cloud-security.
- **Archetype:** Coverage Field (rule 3). A point-in-time snapshot cannot see
  the gap. Only exercised-versus-granted usage over a lookback window can.
- **Why a plate:** the article's central evidence method is granted versus
  exercised. A covered/uncovered field shows that directly. A raster
  "accumulation" metaphor was considered and rejected, because it would show
  growth but not the method for finding it.
- **Concept:** the top row, lit, is exercised in the window: Routinely
  exercised, and Rare but legitimate (window sized to it). The bottom row, in
  violet, is granted but not exercised. It holds three of the article's four
  accumulation mechanisms: Temporary broad policy (never removed), Incident
  wildcard (never narrowed), and Copied role grants (inherited whole).
- **Technically important:** the "Rare but legitimate" zone must stay in
  the covered row. The article warns that a short lookback window
  misclassifies infrequent legitimate use as excess. The fourth mechanism
  (no review owner) is a process gap, not a grant, so it is left out on
  purpose.
- **Must not show:** provider names (AWS, Azure, GCP), real policy or action
  names, a percentage, or any measured quantity. The article has no measured
  data.
- **Crop / safe zone:** plate. Short labels are USED / RARE / TEMP / WILD /
  COPY.
- **Alt concept:** uses the spec `desc`.
- **Sources:** `executiveSummary` (the four mechanisms), `mainContent`, and
  `defensiveRecommendations` 2–3 (granted versus exercised, lookback sized to
  the least-frequent legitimate activity). Cited basis: NIST SP 800-53 AC-6,
  AC-2(2), and the CISA/NSA cloud IAM information sheet.
- **Teaching figure:** none today. **Recommended (proposal):** a code-native
  figure of the four accumulation mechanisms, each mapped to its specific
  fix. That comparison is the article's main instructional structure.
- **Known renderer issue (pre-existing):** in the Coverage Field layout, the
  bottom row sits on the legend rule. The approved
  `protecting-main-branch-beyond-pr-approval` plate shows the same overlap,
  so this is a shared renderer defect, not caused by this spec. Tracked as
  s41.22 and fixed at renderer level on 2026-09-27. The corrected render
  awaits re-review; the plate is not approved.

## 4. Turning an Attack Hypothesis into a Detection: SCHEMATIC PLATE

- **Pillar / category:** detect-respond / detection-engineering.
- **Archetype:** Linear Flow, declared. Each stage consumes the previous
  stage's output. Rule 4 (Gate Sequence) was considered, but these stages
  are a progression, not independent checks that each stop something.
- **Why a plate:** the article is a method with a strict order. The order is
  the lesson.
- **Concept:** Falsifiable hypothesis → Telemetry confirmed (fields
  populated) → Detection logic → Synthetic test corpus (including known gaps)
  → Tuning.
- **Technically important:** "Telemetry confirmed" comes *before* logic
  (article step 2). The corpus explicitly includes known gaps. The plate
  names no ATT&CK ID, because the technique in the article is a worked
  example, not the subject of the cover.
- **Must not show:** a query language, SIEM product names, event IDs,
  technique IDs, an "alert" siren, a radar screen, or a crosshair.
- **Crop / safe zone:** plate. Short labels are HYPO / TELEM / LOGIC / TEST /
  TUNE.
- **Alt concept:** uses the spec `desc`.
- **Sources:** `mainContent` steps 1–5 and `keyTakeaways` 1–4. Cited basis:
  MITRE ATT&CK T1053/T1053.005 and NIST SP 800-94/800-137.
- **Teaching figure:** none today. **Optional (proposal):** a coverage-gap
  figure (what the rule sees versus what it structurally cannot) would add
  to the cover rather than repeat it. It is lower priority than #3 and #5.

## 5. A Backup Is Not Proven Until It Is Restored: RASTER / EDITORIAL

- **Pillar / category:** defend-systems / security-architecture (resilience,
  contingency planning).
- **Archetype:** editorial. No plate archetype fits without flattening the
  thesis.
- **Why raster:** the thesis contrasts two *states* of the same object. One
  is a closed archive that only reports that a job completed. The other is
  the same data unpacked and running inside an isolated environment. That is
  a before-and-after of one physical-feeling thing, which illustration shows
  better than labelled boxes. A plate would become a generic four-step
  checklist that fits any backup article.
- **Concept:** on the left, a closed archive with a single amber indicator
  point, which is a signal, not proof. A fine cyan restore path runs into a
  separate, clearly bounded restoration bay. Inside the bay, the same slabs
  are reassembled into a small working system, calmly lit to show it runs.
  Far right, a dim production structure is separated from the bay by wide
  empty space, with no path connecting them.
- **Technically important:**
  - Amber means UNVERIFIED and cyan means observed/working, matching site
    semantics.
  - Isolation from production is shown as *empty space*, not a violet ring.
    A violet sealed ring cannot have the restore path cross it
    (`graphic-and-diagram-language.md` §2).
  - The restored system is visibly running, not just an opened box.
    Inspection is not restoration (article `mainContent`).
- **Must not show:** any text, numbers, checkmarks, or UI; padlocks, vaults,
  safes, shields, or keys; hard drives, tape reels, or clouds; clocks or
  timers (the article's RTO/RPO point needs *measured* data, which must not
  be implied); ransomware skulls or hooded figures; bloom, lens flare, or
  heavy glow.
- **Composition:** 16:9, 1600×900. The archive sits in the left third, the
  bay centre-right is the focal mass, and production is a faint element at
  the far right. There is generous negative space in the upper band.
- **Crop / safe zone:** the article cover only scales, never crops. The
  catalog card uses `object-fit:cover` at 16:9, so an exact 16:9 asset has
  no crop. Proposed `focalPoint` is about (0.58, 0.55) on the restoration
  bay, to be re-measured on the real asset. The archive's amber point and
  the bay's lit system must stay distinguishable when scaled to a 390 px
  phone width. A future OG card (1200×630) should keep the bay and archive
  inside the central 80%.
- **Alt concept (draft, to be finalized against the real asset):** "A closed
  data archive lit only by a small amber indicator, with a single cyan path
  leading into a separate, bounded restoration bay where the same data has
  been reassembled into a small working system; a dim production structure
  stands apart with empty space and no path between them."
- **Caption (draft):** "A success signal says the job ran. Only a restore
  shows the data comes back."
- **Sources for depicted claims:** `executiveSummary` (success signal ≠
  recoverability), `mainContent` ("restore into an isolated environment, not
  just inspect the archive"), and `keyTakeaways` 1, 2 and 4 (isolated
  restoration; a backup sharing production's access path). Cited basis: NIST
  SP 800-34 Rev. 1, NIST SP 800-53 CP-9/CP-10, CIS Control 11, and the
  CISA #StopRansomware guide.
- **Teaching figure:** none today. **Recommended (proposal):** a code-native
  "evidence ladder" figure (job completed → archive readable → restored in
  isolation → measured against independent evidence). The raster cover must
  not carry those labels, so the factual sequence belongs in a figure.

### Image-generation brief (for use only after owner approval of this batch)

**Target:** 1600×900 PNG source, normalized to WebP via
`scripts/normalize-cover-source.ts`. Per-visual budget: 200 KB. Provenance
must record the generating model, the exact prompt, and the seed if one is
available. Generation stays human-in-the-loop, following the documented
external path. The asset enters at `stage: "asset"`, `reviewStatus:
"pending"`, and only Ravi may promote it.

**Prompt:**

> Editorial cover illustration, 16:9 landscape, for a technical
> cybersecurity article about proving that a backup works by actually
> restoring it. Deep navy to near-black background (#070b12 to #121c2b), flat
> matte finish, generous negative space, calm and precise. Left third: a
> compact, closed data archive drawn as a precise stack of thin dark-navy
> horizontal slabs with crisp edges, unopened, lit only by one small amber
> (#f5b942) indicator point on its face. A single fine cyan (#00e5ff) line
> leaves the archive and crosses open space to the right into a separate,
> clearly bounded restoration bay: a clean rectangular enclosure outlined by
> a thin, even slate-navy line with small technical registration ticks at its
> corners. Inside the bay, the same thin slabs have been unpacked and
> reassembled into a small working system of interlocking rectilinear blocks
> joined by fine cyan paths, evenly and softly lit from within so it clearly
> reads as running. Far right, outside the bay and separated from it by wide
> empty space, a dim, low-contrast silhouette of a larger rectilinear
> structure; no line, beam, or path connects the bay to it. Orthographic,
> slightly isometric drafting perspective; technical schematic geometry;
> restrained palette of navy tonal layers, cyan only for the restore path and
> the working system, one amber accent only on the archive. No text, letters,
> numbers, labels, logos, user-interface elements, checkmarks, or icons.

**Negative prompt / exclusions:**

> text, letters, numbers, watermark, logo, UI, checkmark, padlock, shield,
> vault door, safe, key, hard drive, tape reel, cloud icon, clock, timer,
> skull, hooded figure, person, hands, code on screen, matrix rain, glitch,
> bloom, lens flare, heavy glow, neon haze, purple-to-blue gradient, violet
> ring, perspective floor reflection, photographic texture, clutter

**Acceptance checks before human review:** the archive and bay are both
legible at 390 px; there is no text-like artefact anywhere (zoom 200%); only
one amber element; no path touches the production silhouette; the image
could not plausibly illustrate an unrelated security article (ten-article
test).

### Generation handoff (one candidate, approved to generate 2026-09-27)

**Limitation.** This Claude Code environment has no sanctioned image
generator. The only generation path this policy records is the external
human-in-the-loop path from the s41.12 pilot (see "Capability status" in
`docs/article-visual-guidelines.md`). A Figma Weave MCP is available to the
agent, but Figma tooling is deferred until after Batch 1, so it was not used.
Neither stock imagery nor a code-rendered substitute was produced.

**To generate the single candidate (human step):**

1. In the external image tool, submit the **Prompt** above verbatim, with
   the **Negative prompt / exclusions** as the tool's negative prompt, or
   appended as "Avoid: ..." if it has none. Aspect 16:9, at least 1600×900.
   Generate **one** image. Do not regenerate to fish for variants; if the one
   candidate fails the acceptance checks, report that instead.
2. Save the raw output unedited as
   `images/backup-restoration-verification-cover-source.png`.
3. Record the manifest below (copy it into the handoff message; do not
   commit the raw PNG).

```text
article: backup-restoration-verification
visualType: cover
generator: <tool name and exact model/version as displayed>
generatedAt: <YYYY-MM-DD>
prompt: <exact text submitted>
negativePrompt: <exact text submitted, or "appended as Avoid: ...">
seed: <value, or "not exposed by tool">
requestedSize: <e.g. 1792x1024>
actualSize: <W x H of saved file>
sha256: <sha256 of images/backup-restoration-verification-cover-source.png>
generatedBy: Ravi Teja Thota
```

**Agent intake after the handoff (not yet done):** verify the sha256; add
this one job to `scripts/normalize-cover-source.ts` (1600×900 WebP,
metadata stripped, 200 KB budget, re-verified from disk); add a
`coverImage` record at `stage: "asset"`, `reviewStatus: "pending"`,
`source: "ai-generated"`, with `generatingModel`, `prompt`, `seed`, and
`createdAt` from the manifest, `focalPoint` measured on the real asset, and
the alt/caption drafts above; then run `check:article-visuals`. While
pending, `checkAssetApprovalGate` blocks merge to main by design. Prepare
1600 px desktop and 390 px mobile review renders. Only Ravi may set `stage:
"reviewed"` and `reviewStatus: "approved"`.

---

## Appendix: proposed Schematic Plate specs (not registered)

As proposed for review. The three approved specs are now in `ARTICLE_PLATES`
with approval records in `PLATE_APPROVALS`. `cloud-iam-permission-creep`
remains unregistered while on hold.

```ts
export const PROPOSED_PLATES: Record<string, PlateSpec> = {
  "segmentation-vs-isolation": {
    plateId: "segmentation-isolation-pair",
    archetype: "divergent-pair",
    headerLabel: "PLATE / RULE OR NO ROUTE",
    title: "Fictional zone architecture contrasting segmentation with isolation",
    desc:
      "A shared services zone reaches a finance zone through a segmentation gateway, on a controlled, filtered path that exists because a named requirement needs it. On the other track, a legacy control zone is enclosed by an unbroken boundary: no route to it was ever built, so there is nothing to filter.",
    caption: "A strict rule still describes a path. Isolation means the path was never built.",
    zones: [
      { id: "shared", label: "Shared services zone", shortLabel: "SHARE", role: "sanctioned" },
      { id: "gateway", label: "Segmentation gateway", shortLabel: "GWAY", sublabel: "filtered, logged", role: "sanctioned" },
      { id: "finance", label: "Finance zone", shortLabel: "FIN", role: "sanctioned" },
      { id: "legacy", label: "Legacy control zone", shortLabel: "LEGCY", sublabel: "no path exists", role: "sealed" },
    ],
    links: [
      { from: "shared", to: "gateway", weight: "primary" },
      { from: "gateway", to: "finance", weight: "primary" },
    ],
    legend: [
      { role: "sanctioned", label: "SEGMENTED: CONTROLLED PATH" },
      { role: "sealed", label: "ISOLATED: NO PATH" },
    ],
  },

  "dependency-confusion-package-trust": {
    plateId: "registry-resolution-gates",
    archetype: "gate-sequence",
    headerLabel: "PLATE / WHICH REGISTRY ANSWERS",
    title: "Fictional package-name resolution gated to one authoritative registry",
    desc:
      "An install request for an internal-sounding package name reaches the package manager, passes a scope mapping that assigns the name to exactly one authoritative registry, and resolves to the internal registry. A same-named package published to the public registry is never consulted, because resolution fails rather than falling through to a second source.",
    caption: "The internal package was never the flaw. Ambiguous resolution chooses the source.",
    zones: [
      { id: "request", label: "Install request", shortLabel: "REQ", sublabel: "internal name", role: "sanctioned" },
      { id: "pm", label: "Package manager", shortLabel: "PKGM", role: "sanctioned" },
      { id: "scope", label: "Scope mapping", shortLabel: "SCOPE", sublabel: "one per name", role: "sanctioned" },
      { id: "internal", label: "Internal registry", shortLabel: "INT", role: "sanctioned" },
      { id: "public", label: "Public lookalike", shortLabel: "LOOK", sublabel: "never consulted", role: "sealed" },
    ],
    links: [
      { from: "request", to: "pm", weight: "primary" },
      { from: "pm", to: "scope", weight: "primary" },
      { from: "scope", to: "internal", weight: "primary" },
    ],
    legend: [
      { role: "sanctioned", label: "AUTHORITATIVE RESOLUTION" },
      { role: "sealed", label: "NO FALL-THROUGH" },
    ],
  },

  "cloud-iam-permission-creep": {
    plateId: "iam-granted-vs-exercised",
    archetype: "coverage-field",
    headerLabel: "PLATE / GRANTED VS EXERCISED",
    title: "Fictional cloud IAM role: exercised permissions versus accumulated grants",
    desc:
      "Above the boundary, the permissions a role actually exercised during a lookback window sized to its least-frequent legitimate task. Below it, grants that accumulated through individually reasonable decisions — a temporary broad policy never removed, an incident wildcard never narrowed, and grants copied from another role — and were not exercised in that window.",
    caption: "Each grant looked reasonable alone. Only usage over a lookback window shows the excess.",
    zones: [
      { id: "routine", label: "Routinely exercised", shortLabel: "USED", role: "sanctioned" },
      { id: "rare", label: "Rare but legitimate", shortLabel: "RARE", sublabel: "window sized to it", role: "sanctioned" },
      { id: "temp", label: "Temporary broad policy", shortLabel: "TEMP", sublabel: "never removed", role: "sealed" },
      { id: "wild", label: "Incident wildcard", shortLabel: "WILD", sublabel: "never narrowed", role: "sealed" },
      { id: "copied", label: "Copied role grants", shortLabel: "COPY", sublabel: "inherited whole", role: "sealed" },
    ],
    legend: [
      { role: "sanctioned", label: "EXERCISED IN WINDOW" },
      { role: "sealed", label: "GRANTED, NOT EXERCISED" },
    ],
  },

  "turning-attack-hypothesis-into-detection": {
    plateId: "hypothesis-to-detection",
    archetype: "linear-flow",
    headerLabel: "PLATE / HYPOTHESIS FIRST",
    title: "Fictional progression from an attack hypothesis to a maintained detection",
    desc:
      "A falsifiable hypothesis names a technique and the telemetry it should produce. The telemetry is confirmed to exist before any logic is written, the logic is tested against a labeled synthetic corpus that includes known gaps, and only then is it tuned. Each stage depends on the one before it.",
    caption: "State what the rule should catch, then prove the telemetry exists, before writing logic.",
    zones: [
      { id: "hypo", label: "Falsifiable hypothesis", shortLabel: "HYPO", role: "sanctioned" },
      { id: "telem", label: "Telemetry confirmed", shortLabel: "TELEM", sublabel: "fields populated", role: "sanctioned" },
      { id: "logic", label: "Detection logic", shortLabel: "LOGIC", role: "sanctioned" },
      { id: "corpus", label: "Synthetic test corpus", shortLabel: "TEST", sublabel: "incl. known gaps", role: "sanctioned" },
      { id: "tune", label: "Tuning", shortLabel: "TUNE", role: "sanctioned" },
    ],
    links: [
      { from: "hypo", to: "telem", weight: "primary" },
      { from: "telem", to: "logic", weight: "primary" },
      { from: "logic", to: "corpus", weight: "primary" },
      { from: "corpus", to: "tune", weight: "primary" },
    ],
  },
};
```
