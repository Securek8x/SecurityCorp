// Published-article visual inventory (bead securitycorp-source-d4e).
//
// Policy lives in docs/article-visual-guidelines.md ("Visual inventory").
// This module only DERIVES state from the compiled catalog, so the inventory
// cannot drift from what actually renders:
//
//   - cover state      from `coverSlotOccupant` / `hasCanonicalCover` in
//                      lib/article-visuals.ts — the same definition the
//                      cover gate enforces (a rendered raster cover keeps the
//                      cover slot; its plate moves in-body);
//   - teaching figure  from `diagram`, plus an explicit, human-recorded
//                      assessment map for articles without one;
//   - approval         from the raster visual's own provenance record, or the
//                      recorded plate-pilot approval below. Asset existence
//                      never implies approval, and nothing here infers it.
//
// Count published articles from the compiled catalog, never from source text
// (see the corrected-baseline note in lib/article-plates.ts).

import { publishedKnowledgeArticles } from "./knowledge-content.ts";
import type { KnowledgeArticle } from "./knowledge-content.ts";
import { plateForSlug } from "./article-plates.ts";
import { coverSlotOccupant, hasCanonicalCover, isVisualProductionEligible } from "./article-visuals.ts";
import type { CoverSlotOccupant } from "./article-visuals.ts";

/** What renders in the cover slot (`coverSlotOccupant`): "raster" — a
 *  `coverImage` at stage "asset" or "reviewed"; "plate" — a Schematic Plate;
 *  "none" — nothing. Occupying the slot is not the same as having a
 *  canonical cover: see `canonicalCover` on the row. */
export type CoverState = CoverSlotOccupant;

export type ApprovalState =
  /** A named human approval is recorded for this exact visual. */
  | "human-approved"
  /** A visual renders but has no human approval yet (raster stage "asset"). */
  | "pending-human-review"
  /** Nothing to approve. */
  | "not-applicable";

export type TeachingFigureState =
  /** A code-native `KnowledgeArticle["diagram"]` exists. */
  | "present"
  /** A human reviewer recorded that a teaching figure should be added. */
  | "recommended"
  /** A human reviewer recorded that the article does not need one. */
  | "unnecessary"
  /** No figure and no recorded assessment. The honest default. */
  | "not-assessed";

/** Human approval of the bounded Schematic Plate pilot, recorded in the
 *  close reason of bead securitycorp-source-s41.12: "Approved by Ravi Teja
 *  Thota, scoped to exactly these nine implementations." It covers only the
 *  plates present at that approval (lib/article-plates.ts, unchanged since
 *  8f1e065); a plate added to ARTICLE_PLATES later
 *  must be added to PLATE_PILOT_APPROVED_SLUGS by a human, not by an agent. */
export const PLATE_PILOT_APPROVAL = {
  reviewer: "Ravi Teja Thota",
  reviewedAt: "2026-09-13",
  source: "securitycorp-source-s41.12",
} as const;

export const PLATE_PILOT_APPROVED_SLUGS: readonly string[] = [
  "securing-api-authentication-authorization",
  "protecting-main-branch-beyond-pr-approval",
  "docker-sock-mounting-security-risks",
  "preventing-path-traversal-through-boundary-validation",
  "workload-identities-vs-long-lived-credentials",
  "safely-analyzing-packet-captures",
  "designing-fail-closed-security-automation",
  "understanding-network-trust-boundaries",
  "scoping-authorized-security-assessment",
];

/** Human-recorded teaching-figure assessments for articles WITHOUT a
 *  diagram. Empty on purpose: no assessment has been recorded yet, and an
 *  agent must not fill this in on a human's behalf. */
export const TEACHING_FIGURE_ASSESSMENTS: Readonly<
  Record<string, { state: "recommended" | "unnecessary"; assessedBy: string; assessedAt: string; note: string }>
> = {};

export type ArticleVisualInventoryRow = {
  slug: string;
  pillar: string;
  cover: CoverState;
  coverApproval: ApprovalState;
  /** A plate that renders in-body because a raster cover holds the slot. */
  inBodyPlate: boolean;
  /** `hasCanonicalCover` — the same definition the cover gate enforces. */
  canonicalCover: boolean;
  teachingFigure: TeachingFigureState;
};

function coverApprovalFor(article: KnowledgeArticle, cover: CoverState): ApprovalState {
  if (cover === "none") return "not-applicable";
  if (cover === "raster") {
    return isVisualProductionEligible(article.coverImage) ? "human-approved" : "pending-human-review";
  }
  return PLATE_PILOT_APPROVED_SLUGS.includes(article.meta.slug) ? "human-approved" : "pending-human-review";
}

export function inventoryRow(article: KnowledgeArticle): ArticleVisualInventoryRow {
  const gateInput = { coverImage: article.coverImage, hasPlate: Boolean(plateForSlug(article.meta.slug)) };
  const cover: CoverState = coverSlotOccupant(gateInput);
  const assessment = TEACHING_FIGURE_ASSESSMENTS[article.meta.slug];
  return {
    slug: article.meta.slug,
    pillar: article.meta.pillar,
    cover,
    coverApproval: coverApprovalFor(article, cover),
    inBodyPlate: cover === "raster" && gateInput.hasPlate,
    canonicalCover: hasCanonicalCover(gateInput),
    teachingFigure: article.diagram ? "present" : assessment ? assessment.state : "not-assessed",
  };
}

export function publishedVisualInventory(
  articles: readonly KnowledgeArticle[] = publishedKnowledgeArticles,
): ArticleVisualInventoryRow[] {
  return articles.map(inventoryRow).sort((a, b) => a.slug.localeCompare(b.slug));
}

export type ArticleVisualInventorySummary = {
  published: number;
  withCover: number;
  withCanonicalCover: number;
  rasterCovers: number;
  plateCovers: number;
  inBodyPlates: number;
  withoutCover: number;
  coversHumanApproved: number;
  coversPendingHumanReview: number;
  teachingFigures: Record<TeachingFigureState, number>;
};

export function summarizeVisualInventory(rows: readonly ArticleVisualInventoryRow[]): ArticleVisualInventorySummary {
  const count = (pred: (r: ArticleVisualInventoryRow) => boolean) => rows.filter(pred).length;
  return {
    published: rows.length,
    withCover: count((r) => r.cover !== "none"),
    withCanonicalCover: count((r) => r.canonicalCover),
    rasterCovers: count((r) => r.cover === "raster"),
    plateCovers: count((r) => r.cover === "plate"),
    inBodyPlates: count((r) => r.inBodyPlate),
    withoutCover: count((r) => r.cover === "none"),
    coversHumanApproved: count((r) => r.coverApproval === "human-approved"),
    coversPendingHumanReview: count((r) => r.coverApproval === "pending-human-review"),
    teachingFigures: {
      present: count((r) => r.teachingFigure === "present"),
      recommended: count((r) => r.teachingFigure === "recommended"),
      unnecessary: count((r) => r.teachingFigure === "unnecessary"),
      "not-assessed": count((r) => r.teachingFigure === "not-assessed"),
    },
  };
}

/** Baseline verified 2026-09-27 against origin/main e41b81e and asserted in
 *  the test suite, so a catalog change forces a deliberate update here and
 *  in docs/article-visual-guidelines.md rather than silent drift. */
export const VISUAL_INVENTORY_BASELINE: ArticleVisualInventorySummary = {
  published: 42,
  withCover: 10,
  withCanonicalCover: 10,
  rasterCovers: 3,
  plateCovers: 7,
  inBodyPlates: 2,
  withoutCover: 32,
  coversHumanApproved: 10,
  coversPendingHumanReview: 0,
  teachingFigures: { present: 29, recommended: 0, unnecessary: 0, "not-assessed": 13 },
};
