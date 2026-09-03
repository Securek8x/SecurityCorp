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
  mobileCropNotes: string;
  exportFormats: string[];
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
 * ArticleVisual an article defines. */
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
    if (!b.readerTakeaway?.trim()) push("brief missing readerTakeaway");
    if (!b.whyThisHelps?.trim()) push("brief missing whyThisHelps");
    if (!b.placement?.trim()) push("brief missing placement");
    if (!b.mustShow || b.mustShow.length === 0) push('brief missing "must show" elements');
    if (!b.mustNotShow || b.mustNotShow.length === 0) push('brief missing "must not show" elements');
    if (!b.exportFormats || b.exportFormats.length === 0) push("brief missing exportFormats");
    if (!Number.isFinite(b.sizeBudgetKb) || b.sizeBudgetKb <= 0) push("brief missing a positive sizeBudgetKb");
    for (const claim of b.factualClaims ?? []) {
      if (!claim.source?.trim()) push(`factual claim "${claim.claim}" has no supporting source`);
    }
  }

  // Provenance
  const p = visual.provenance;
  if (!p) {
    push("missing provenance");
  } else {
    if (!VISUAL_SOURCES.includes(p.source)) push(`invalid provenance.source "${p.source}"`);
    if (!isValidDate(p.createdAt)) push(`provenance.createdAt "${p.createdAt}" is not a valid date`);
    if (!VISUAL_LICENSES.includes(p.license)) push(`invalid provenance.license "${p.license}"`);
    if (!p.editableSourceRef?.trim()) push("provenance missing editableSourceRef");
    if (!VISUAL_REVIEW_STATUSES.includes(p.reviewStatus)) push(`invalid provenance.reviewStatus "${p.reviewStatus}"`);
    if (p.reviewStatus === "approved" && (!p.reviewer?.trim() || !isValidDate(p.reviewedAt) || !p.reviewedAt)) {
      push("provenance.reviewStatus is approved but reviewer/reviewedAt is missing or invalid");
    }
    if (p.source === "ai-generated" && visual.stage !== "brief") {
      if (!p.generatingModel?.trim()) push("ai-generated asset missing provenance.generatingModel");
      if (!p.prompt?.trim()) push("ai-generated asset missing provenance.prompt");
    }
    if (p.source === "brief-only" && visual.stage !== "brief") {
      push('provenance.source is "brief-only" but stage is not "brief" — update source once a real asset exists');
    }
  }

  // Publication-safety: scan every free-text field a human could have typed real infrastructure into.
  for (const [field, text] of [
    ["alt", visual.alt],
    ["caption", visual.caption],
    ["credit", visual.credit],
    ["purpose", visual.purpose],
    ["provenance.prompt", visual.provenance?.prompt],
    ["provenance.editableSourceRef", visual.provenance?.editableSourceRef],
  ] as const) {
    if (!text) continue;
    for (const finding of scanTextForLeaks(text, field)) {
      push(`${field} "${text}": possible ${finding.rule} ("${finding.match}")`);
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
