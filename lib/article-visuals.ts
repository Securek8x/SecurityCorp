// Article visual system: cover images and in-body visual provenance
// (Bead securitycorp-source-s41.9/s41.10/s41.11/s41.12 pilot). Separate,
// type-safe module extending KnowledgeArticle — same additive pattern as
// lib/claim-ledger.ts and lib/content-freshness.ts, not a parallel
// registry. Policy and prose live in docs/article-visual-guidelines.md;
// this file is data shape and validation only.
//
// Scope note: a "teaching visual" (a factual diagram of a workflow, trust
// boundary, or comparison) is covered by the EXISTING `KnowledgeArticle
// ["diagram"]` field (components/diagrams/interactive-flow-diagram.tsx) —
// code-native SVG/React, already accessible, already reviewed through the
// normal PR process. This module does not duplicate that mechanism or
// require a parallel provenance record for it; a diagram's provenance is
// the PR that introduced it. This module covers the genuinely new
// surface: a cover/hero image, and any future in-body raster illustration
// that isn't a diagram.
import { scanTextForLeaks } from "./privacy-leak-gate.ts";

export const VISUAL_SOURCES = ["ai-generated", "human-illustrated", "photographed", "brief-only"] as const;
export type VisualSource = (typeof VISUAL_SOURCES)[number];

export const VISUAL_TYPES = ["cover", "in-body-illustration"] as const;
export type VisualType = (typeof VISUAL_TYPES)[number];

export const VISUAL_LICENSES = ["site-original-all-rights-reserved", "cc0", "cc-by", "cc-by-sa"] as const;
export type VisualLicense = (typeof VISUAL_LICENSES)[number];

export const VISUAL_REVIEW_STATUSES = ["pending", "approved", "needs-revision", "rejected"] as const;
export type VisualReviewStatus = (typeof VISUAL_REVIEW_STATUSES)[number];

/** A visual's lifecycle stage — this IS the "documented migration state"
 * the rollout plan depends on. "brief" is the only stage a `source:
 * "brief-only"` visual can be in (no approved image-generation capability
 * is currently available in this repo — see docs/article-visual-
 * guidelines.md's Capability Status section); "asset" means a real file
 * exists at `src`. The publication gate (check:article-visuals --enforce-
 * cover, once enabled) only requires stage "asset" or later. */
export const VISUAL_STAGES = ["brief", "asset", "reviewed"] as const;
export type VisualStage = (typeof VISUAL_STAGES)[number];

export type VisualProvenance = {
  source: VisualSource;
  /** Human name, when source is "human-illustrated" or "photographed". */
  creator?: string;
  /** e.g. "ui-ux-pro-max / gemini-3-pro-image-preview" — required once source is "ai-generated" and stage is "asset" or later. */
  generatingModel?: string;
  /** The exact prompt used, when source is "ai-generated" and an asset exists. */
  prompt?: string;
  seed?: string;
  /** ISO date the brief was written or the asset was produced. */
  createdAt: string;
  license: VisualLicense;
  /** Path to the editable source: a design file, an SVG source, or (for
   * "brief-only") this same brief record — a brief IS its own editable
   * source until an asset exists. */
  editableSourceRef: string;
  reviewStatus: VisualReviewStatus;
  reviewer?: string;
  reviewedAt?: string;
};

/** The structured brief template every visual (generated or not) starts
 * from — required at "brief" stage, kept afterward as the record of what
 * was asked for. Mirrors docs/article-visual-guidelines.md's brief
 * template exactly; keep both in sync if either changes. */
export type VisualBrief = {
  articleSlug: string;
  readerTakeaway: string;
  whyThisHelps: string;
  visualType: VisualType;
  placement: string;
  mustShow: string[];
  mustNotShow: string[];
  factualClaims: { claim: string; source: string }[];
  compositionNotes: string;
  /** What must stay legible/composition-safe at a narrow viewport. Despite
   * the name, this does NOT mean a literal crop occurs — the shared
   * article shell (app/globals.css `.article-figure img`) only ever
   * scales an image (`width:100%;height:auto`), never crops it. Write
   * this field as a mobile-safe composition requirement ("X must still
   * read at small scaled-down sizes"), not a claim that a specific region
   * gets cropped in. A real crop DOES happen on catalog-card thumbnails
   * (`.guide-card-thumb{object-fit:cover}`), driven by `focalPoint` below
   * — that's the one surface this field's "crop" language can honestly
   * describe. */
  mobileCropNotes: string;
  /** Delivery format(s) this brief requests. The current rendering
   * contract (ArticleFigure/ArticleVisual) supports exactly ONE delivered
   * file per visual — there is no `<picture>`/multi-source model yet — so
   * this must list exactly one format. AVIF (or another second format)
   * can be added later as a real `<picture>` implementation, but until
   * then a brief must not claim a format the rendering path can't use. */
  exportFormats: string[];
  /** This visual's own size budget in KB — enforced per-visual by
   * scripts/check-article-visuals.ts (not a shared global number). A
   * separate, generous absolute ceiling still applies as a backstop. */
  sizeBudgetKb: number;
};

export type ArticleVisual = {
  stage: VisualStage;
  visualType: VisualType;
  /** Asset path relative to /public, e.g. "/article-visuals/<slug>-cover.avif". Undefined at stage "brief". */
  src?: string;
  alt: string;
  caption?: string;
  credit?: string;
  width: number;
  height: number;
  /** Normalized 0-1 focal point for responsive/wide crops. Defaults to center (0.5, 0.5) if omitted. */
  focalPoint?: { x: number; y: number };
  purpose: string;
  brief: VisualBrief;
  provenance: VisualProvenance;
};

function isValidDate(value: string | undefined): boolean {
  if (value === undefined) return true;
  return !Number.isNaN(new Date(value).getTime());
}

const MIN_ALT_LENGTH = 12;
const FILENAME_LIKE_PATTERN = /^[\w-]+\.(png|jpe?g|svg|avif|webp)$/i;

/** Validates one visual (cover or in-body) in isolation. Call for every
 * ArticleVisual an article defines. This checks internal consistency and
 * data completeness only — it does NOT decide whether a visual is
 * approved for production use; see `isVisualProductionEligible` /
 * `checkAssetApprovalGate` below for that separate concern. */
export function validateArticleVisual(visual: ArticleVisual, articleSlug: string): string[] {
  const errors: string[] = [];
  const push = (msg: string) => errors.push(`${articleSlug} ${visual.visualType}: ${msg}`);

  if (!VISUAL_STAGES.includes(visual.stage)) push(`invalid stage "${visual.stage}"`);
  if (!VISUAL_TYPES.includes(visual.visualType)) push(`invalid visualType "${visual.visualType}"`);

  if (!visual.alt?.trim()) push("missing alt text");
  else {
    if (visual.alt.trim().length < MIN_ALT_LENGTH) push(`alt text too short ("${visual.alt}") — describe the actual content, not a label`);
    if (FILENAME_LIKE_PATTERN.test(visual.alt.trim())) push(`alt text looks like a filename ("${visual.alt}")`);
  }
  if (!visual.purpose?.trim()) push("missing purpose/learning-objective");

  if (visual.stage === "brief") {
    if (visual.src) push('stage is "brief" but src is set — should be "asset" or later once a real file exists');
  } else {
    if (!visual.src?.trim()) push(`stage is "${visual.stage}" but src is missing`);
    if (!Number.isFinite(visual.width) || visual.width <= 0) push("missing or invalid width");
    if (!Number.isFinite(visual.height) || visual.height <= 0) push("missing or invalid height");
  }

  if (visual.focalPoint) {
    const { x, y } = visual.focalPoint;
    if (x < 0 || x > 1 || y < 0 || y > 1) push(`focalPoint out of 0-1 range (${x}, ${y})`);
  }

  // Brief completeness (required at every stage — the brief is retained, not discarded once an asset exists).
  const b = visual.brief;
  if (!b) {
    push("missing brief");
  } else {
    if (b.articleSlug !== articleSlug) push(`brief.articleSlug "${b.articleSlug}" does not match article slug`);
    if (b.visualType !== visual.visualType) push(`brief.visualType "${b.visualType}" does not match the visual's own visualType "${visual.visualType}"`);
    if (!b.readerTakeaway?.trim()) push("brief missing readerTakeaway");
    if (!b.whyThisHelps?.trim()) push("brief missing whyThisHelps");
    if (!b.placement?.trim()) push("brief missing placement");
    if (!b.mustShow || b.mustShow.length === 0) push('brief missing "must show" elements');
    if (!b.mustNotShow || b.mustNotShow.length === 0) push('brief missing "must not show" elements');
    if (!b.compositionNotes?.trim()) push("brief missing compositionNotes");
    if (!b.mobileCropNotes?.trim()) push("brief missing mobileCropNotes");
    if (!b.exportFormats || b.exportFormats.length === 0) push("brief missing exportFormats");
    else if (b.exportFormats.length > 1) {
      push(`brief.exportFormats lists ${b.exportFormats.length} formats (${b.exportFormats.join(", ")}) — the current rendering contract delivers exactly one file per visual; narrow to one format`);
    }
    if (!Number.isFinite(b.sizeBudgetKb) || b.sizeBudgetKb <= 0) push("brief missing a positive sizeBudgetKb");
    for (const claim of b.factualClaims ?? []) {
      if (!claim.claim?.trim()) push('a factual claim entry has an empty "claim"');
      if (!claim.source?.trim()) push(`factual claim "${claim.claim}" has no supporting source`);
    }
  }

  // Provenance
  const p = visual.provenance;
  if (!p) {
    push("missing provenance");
  } else {
    if (!VISUAL_SOURCES.includes(p.source)) push(`invalid provenance.source "${p.source}"`);
    if (!p.createdAt?.trim()) push("provenance missing createdAt");
    else if (!isValidDate(p.createdAt)) push(`provenance.createdAt "${p.createdAt}" is not a valid date`);
    if (!VISUAL_LICENSES.includes(p.license)) push(`invalid provenance.license "${p.license}"`);
    if (!p.editableSourceRef?.trim()) push("provenance missing editableSourceRef");
    if (!VISUAL_REVIEW_STATUSES.includes(p.reviewStatus)) push(`invalid provenance.reviewStatus "${p.reviewStatus}"`);

    // Lifecycle/review-status consistency — an agent must never be able to
    // construct a record that reads as human-approved without actually
    // being at the "reviewed" stage, and "reviewed" must never sit without
    // an actual approval behind it. This is the type-level half of the
    // human-approval requirement; isVisualProductionEligible below is the
    // release-gate half.
    if (p.reviewStatus === "approved" && (!p.reviewer?.trim() || !p.reviewedAt || !isValidDate(p.reviewedAt))) {
      push("provenance.reviewStatus is approved but reviewer/reviewedAt is missing or invalid");
    }
    if (p.reviewStatus === "approved" && visual.stage !== "reviewed") {
      push('provenance.reviewStatus is "approved" but stage is not "reviewed" — promote stage to "reviewed" once a human approves');
    }
    if (visual.stage === "reviewed" && p.reviewStatus !== "approved") {
      push(`stage is "reviewed" but provenance.reviewStatus is "${p.reviewStatus}", not "approved" — "reviewed" means an approved review exists`);
    }

    if (p.source === "ai-generated" && visual.stage !== "brief") {
      if (!p.generatingModel?.trim()) push("ai-generated asset missing provenance.generatingModel");
      if (!p.prompt?.trim()) push("ai-generated asset missing provenance.prompt");
    }
    if ((p.source === "human-illustrated" || p.source === "photographed") && !p.creator?.trim()) {
      push(`provenance.source is "${p.source}" but provenance.creator is missing`);
    }
    if (p.source === "brief-only" && visual.stage !== "brief") {
      push('provenance.source is "brief-only" but stage is not "brief" — update source once a real asset exists');
    }
  }

  // Publication-safety: scan every free-text field a human could have typed
  // real infrastructure, credentials, or PII into — brief prose included,
  // since a brief's mustShow/mustNotShow/composition notes are exactly the
  // kind of field a careless brief could leak into.
  const textFields: [string, string | undefined][] = [
    ["alt", visual.alt],
    ["caption", visual.caption],
    ["credit", visual.credit],
    ["purpose", visual.purpose],
    ["provenance.prompt", visual.provenance?.prompt],
    ["provenance.editableSourceRef", visual.provenance?.editableSourceRef],
    ["provenance.creator", visual.provenance?.creator],
  ];
  if (visual.brief) {
    textFields.push(
      ["brief.readerTakeaway", visual.brief.readerTakeaway],
      ["brief.whyThisHelps", visual.brief.whyThisHelps],
      ["brief.placement", visual.brief.placement],
      ["brief.compositionNotes", visual.brief.compositionNotes],
      ["brief.mobileCropNotes", visual.brief.mobileCropNotes],
      ...visual.brief.mustShow.map((v, i): [string, string] => [`brief.mustShow[${i}]`, v]),
      ...visual.brief.mustNotShow.map((v, i): [string, string] => [`brief.mustNotShow[${i}]`, v]),
      ...(visual.brief.factualClaims ?? []).flatMap((c, i): [string, string][] => [
        [`brief.factualClaims[${i}].claim`, c.claim],
        [`brief.factualClaims[${i}].source`, c.source],
      ]),
    );
  }
  for (const [field, text] of textFields) {
    if (!text) continue;
    for (const finding of scanTextForLeaks(text, field)) {
      push(`${field} "${text}": possible ${finding.rule} ("${finding.match}")`);
    }
  }

  return errors;
}

/** Whether a visual, if one is present, is approved for production use —
 * a separate concern from whether a cover is REQUIRED at all (that's
 * `checkCoverImageGate` / `VISUAL_GATE_ENABLED` below, which stays
 * disabled during the migration period). This check is NOT gated by
 * `VISUAL_GATE_ENABLED` and always applies: a "brief" has nothing
 * rendered and is trivially eligible; an "asset" is real and may render
 * on an unmerged branch's Cloudflare Pages preview for human inspection,
 * but is never production-eligible until a human promotes it to stage
 * "reviewed" with `reviewStatus: "approved"`. An agent must never set
 * that combination itself — see the lifecycle checks inside
 * `validateArticleVisual` above, which make that combination invalid
 * unless a real named reviewer/date is present. */
export function isVisualProductionEligible(visual: ArticleVisual | undefined): boolean {
  if (!visual) return true;
  if (visual.stage === "brief") return true;
  return visual.stage === "reviewed" && visual.provenance.reviewStatus === "approved";
}

/** Always-on release gate (unlike checkCoverImageGate) — a real asset that
 * exists but isn't yet human-approved must never pass this check,
 * regardless of VISUAL_GATE_ENABLED. Call for every article, not just
 * published ones, so a not-yet-published article can't quietly carry a
 * rejected/needs-revision asset either. */
export function checkAssetApprovalGate(articles: QueueableVisualArticle[]): string[] {
  const errors: string[] = [];
  for (const a of articles) {
    if (a.coverImage && !isVisualProductionEligible(a.coverImage)) {
      errors.push(
        `${a.meta.slug}: coverImage at stage "${a.coverImage.stage}" with reviewStatus "${a.coverImage.provenance.reviewStatus}" is not production-eligible (requires stage "reviewed" with reviewStatus "approved") — fine on an unmerged preview branch, not mergeable to main`,
      );
    }
  }
  return errors;
}

export type QueueableVisualArticle = { meta: { slug: string; status: string }; coverImage?: ArticleVisual };

/** Publication-gate check (disabled by default during migration — see
 * VISUAL_GATE_ENABLED below). Once enabled, a published article without a
 * cover at stage "asset" or later fails this check. */
export const VISUAL_GATE_ENABLED = false;

export function checkCoverImageGate(articles: QueueableVisualArticle[]): string[] {
  if (!VISUAL_GATE_ENABLED) return [];
  const errors: string[] = [];
  for (const a of articles) {
    if (a.meta.status !== "published") continue;
    if (!a.coverImage || a.coverImage.stage === "brief") {
      errors.push(`${a.meta.slug}: published without a cover image asset (VISUAL_GATE_ENABLED is on)`);
    }
  }
  return errors;
}
