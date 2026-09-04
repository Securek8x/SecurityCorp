// Canonical knowledge-base article metadata model (Bead
// securitycorp-source-4zl.60) plus runtime validation. Hand-written
// validators rather than a schema library: the repository has no existing
// validation dependency, the rule set here is small and mostly enum/
// cross-field checks, and a bundle-affecting dependency isn't justified for
// that. See docs/knowledge-base.md for how this is intended to be used by
// future article authoring.
import { type CategoryId, type PillarId, categoryById, pillarById } from "./taxonomy.ts";
import { validateTags } from "./knowledge-tags.ts";

export const CONTENT_TYPES = [
  "guide",
  "lab",
  "detection",
  "playbook",
  "field-note",
  "deep-dive",
  "checklist",
  "case-study",
  "tool-review",
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

// Every value that has appeared across the pillar/category Beads'
// "Intended audiences" text (securitycorp-source-4zl.54–.59).
export const AUDIENCES = ["beginner", "practitioner", "security-engineer", "recruiter", "career-changer"] as const;
export type Audience = (typeof AUDIENCES)[number];

export const EDITORIAL_STATUSES = [
  "idea",
  "planned",
  "drafting",
  "technical-review",
  "privacy-review",
  "ready",
  "published",
  "needs-update",
  "retired",
] as const;
export type EditorialStatus = (typeof EDITORIAL_STATUSES)[number];

/** The only status that may appear in any public surface (catalog, RSS,
 * sitemap, structured data, related-content). Everything else — including
 * "ready", which has passed review but not been released yet — stays
 * internal. */
export const PUBLIC_STATUS: EditorialStatus = "published";

// Evidence labels are author assertions, not an automated conclusion.
// In particular, VALIDATED is never inferred from a zero exit code, a
// running service, a healthy container, a success log, or an HTTP 200.
export const EVIDENCE_STATES = ["VALIDATED", "DESIGN ONLY", "UNVERIFIED"] as const;
export type EvidenceState = (typeof EVIDENCE_STATES)[number];

export type ReviewStatus = "pending" | "approved" | "rejected";
export type ReviewRecord = { status: ReviewStatus; reviewer?: string; reviewedAt?: string };

export const TAG_MIN = 2;
export const TAG_MAX = 4;

export type KnowledgeArticleMeta = {
  title: string;
  slug: string;
  summary: string;
  pillar: PillarId;
  primaryCategory: CategoryId;
  secondaryCategory?: CategoryId;
  contentType: ContentType;
  difficulty: Difficulty;
  status: EditorialStatus;
  tags: string[];
  audience: Audience[];
  estimatedReadingMinutes: number;
  publishedAt?: string;
  updatedAt?: string;
  lastReviewedAt?: string;
  /** Concise, reader-facing note on what changed — surfaced beside
   * `updatedAt` only when both are set (securitycorp-source-nyu). Optional
   * and additive like the other retrofit-later fields on this type: no
   * existing article has one, and none is required to have one. Meant for
   * substantive content revisions, not every editorial nit. */
  changeNote?: string;
  labRequired: boolean;
  authorizedLabOnly: boolean;
  vendorNeutral: boolean;
  evidenceState: EvidenceState;
  privacyReview: ReviewRecord;
  technicalReview: ReviewRecord;
  /** Explicit human decision required by the publication-safety policy. */
  publicationApproval: ReviewRecord;
};

function isValidDate(value: string | undefined): boolean {
  if (value === undefined) return true;
  return !Number.isNaN(new Date(value).getTime());
}

/** Validates one article's metadata in isolation. Slug-uniqueness (which
 * requires the full catalog) is checked separately by
 * validateCatalogIntegrity so a single-article check stays cheap and usable
 * from an editor/authoring context. */
export function validateArticleMeta(meta: KnowledgeArticleMeta): string[] {
  const errors: string[] = [];
  const push = (msg: string) => errors.push(`${meta.slug || "(no slug)"}: ${msg}`);

  if (!meta.title.trim()) push("title is required");
  if (!meta.slug.trim()) push("slug is required");
  if (!meta.summary.trim()) push("summary is required");

  if (!pillarById.has(meta.pillar)) push(`unknown pillar "${meta.pillar}"`);

  const primary = categoryById.get(meta.primaryCategory);
  if (!primary) push(`unknown primaryCategory "${meta.primaryCategory}"`);
  else if (primary.pillar !== meta.pillar) push(`primaryCategory "${meta.primaryCategory}" does not belong to pillar "${meta.pillar}"`);

  if (meta.secondaryCategory !== undefined) {
    if (!categoryById.has(meta.secondaryCategory)) push(`unknown secondaryCategory "${meta.secondaryCategory}"`);
    if (meta.secondaryCategory === meta.primaryCategory) push("secondaryCategory must not equal primaryCategory");
  }

  if (!CONTENT_TYPES.includes(meta.contentType)) push(`invalid contentType "${meta.contentType}"`);
  if (!DIFFICULTIES.includes(meta.difficulty)) push(`invalid difficulty "${meta.difficulty}"`);
  if (!EDITORIAL_STATUSES.includes(meta.status)) push(`invalid status "${meta.status}"`);
  if (!EVIDENCE_STATES.includes(meta.evidenceState)) push(`invalid evidenceState "${meta.evidenceState}"`);

  if (meta.audience.length === 0) push("audience must list at least one value");
  for (const a of meta.audience) if (!AUDIENCES.includes(a)) push(`invalid audience "${a}"`);

  if (!Number.isFinite(meta.estimatedReadingMinutes) || meta.estimatedReadingMinutes <= 0) {
    push("estimatedReadingMinutes must be a positive number");
  }

  for (const [field, value] of [
    ["publishedAt", meta.publishedAt],
    ["updatedAt", meta.updatedAt],
    ["lastReviewedAt", meta.lastReviewedAt],
  ] as const) {
    if (!isValidDate(value)) push(`${field} "${value}" is not a valid date`);
  }

  for (const tagError of validateTags(meta.tags)) push(tagError);

  if (meta.status === PUBLIC_STATUS) {
    if (meta.tags.length < TAG_MIN || meta.tags.length > TAG_MAX) {
      push(`published content requires ${TAG_MIN}-${TAG_MAX} tags, found ${meta.tags.length}`);
    }
    if (!meta.publishedAt) push("published content requires publishedAt");
    if (!meta.lastReviewedAt) push("published content requires lastReviewedAt");
    if (meta.privacyReview.status !== "approved") push("published content requires an approved privacyReview");
    if (meta.technicalReview.status !== "approved") push("published content requires an approved technicalReview");
    if (meta.publicationApproval.status !== "approved") push("published content requires explicit human publicationApproval");
    if (!meta.publicationApproval.reviewer?.trim()) push("published content requires a named human approver");
    if (!meta.publicationApproval.reviewedAt || !isValidDate(meta.publicationApproval.reviewedAt)) {
      push("published content requires a valid publicationApproval.reviewedAt");
    }
  }

  return errors;
}

/** Cross-article checks that need the whole catalog: slug uniqueness. Call
 * once over every known article (any status), not just published ones —
 * a draft can't silently reuse a published slug either. */
export function validateCatalogIntegrity(all: KnowledgeArticleMeta[]): string[] {
  const errors: string[] = [];
  const seen = new Map<string, number>();
  all.forEach((a) => seen.set(a.slug, (seen.get(a.slug) ?? 0) + 1));
  for (const [slug, count] of seen) {
    if (count > 1) errors.push(`duplicate slug "${slug}" (${count} articles)`);
  }
  return errors;
}

/** The only predicate every public surface (catalog, pillar/category pages,
 * sitemap, RSS, structured data, related-content) should use to decide
 * whether an article may be shown. Never check `status` directly at a call
 * site — a future status or review requirement only needs to change here. */
export function isPubliclyVisible(meta: KnowledgeArticleMeta): boolean {
  return meta.status === PUBLIC_STATUS && validateArticleMeta(meta).length === 0;
}
