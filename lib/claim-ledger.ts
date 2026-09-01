// Claim-level evidence ledger (Bead securitycorp-source-5q3). Separates
// automated URL/reachability status (scripts/check-citations.ts) from
// human semantic claim verification. A citation script proving a URL is
// reachable is not proof that URL supports what the article says it
// supports — this ledger gives every material externally verifiable claim
// its own stable identifier, linked explicitly to the source(s) that back
// it, with a human review state tracked independently of any automated
// status. Hand-written validation, same rationale as lib/knowledge-
// schema.ts: a small rule set, no existing schema-library dependency.
//
// Optional and additive: an article with no `claims` array is unaffected —
// this establishes the mechanism and its validation for new or updated
// articles going forward. Retrofitting the existing 24-article catalog
// with ledger entries is a separate, much larger content-editing effort,
// deliberately out of this bead's engineering scope.
//
// Authoring convention: to link a specific sentence in an article's prose
// to a ledger entry, embed a `[[claim:<claimId>]]` marker immediately after
// it in the relevant UniversalSections string. validateClaimReferences
// below scans every prose string for these markers and flags one that
// doesn't resolve to a real claimId in the article's `claims` array — this
// is what stops an unreviewed or removed claim from silently going stale.
import type { UniversalSections } from "./knowledge-content-types.ts";

export type ClaimSource = {
  sourceId: string;
  publisher: string;
  /** Document version/revision, e.g. "SP 800-53 Rev. 5" — not a date. */
  version?: string;
  /** ISO date this source was accessed to support the claim. */
  accessedAt: string;
  /** Where within the source the claim is supported — a section, control ID, page, or heading. */
  locator?: string;
  url?: string;
};

export type ClaimSemanticReview = {
  status: "reviewed" | "unreviewed";
  reviewer?: string;
  reviewedAt?: string;
  notes?: string;
};

export type ArticleClaim = {
  claimId: string;
  /** The claim statement, or a short paraphrase — for human review, independent of where it's quoted in prose. */
  statement: string;
  /** Where in THIS article the claim appears, e.g. a section name or "mainContent[2]". */
  locator: string;
  sources: ClaimSource[];
  semanticReview: ClaimSemanticReview;
};

const CLAIM_MARKER_PATTERN = /\[\[claim:([a-z0-9-]+)\]\]/g;
const CLAIM_ID_PATTERN = /^[a-z0-9-]+$/;

function isValidDate(value: string | undefined): boolean {
  if (value === undefined) return true;
  return !Number.isNaN(new Date(value).getTime());
}

/** Validates one article's claim ledger in isolation. Call for any article
 * that defines `claims`; an article with no claims array needs no call. */
export function validateClaimLedger(claims: ArticleClaim[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const claim of claims) {
    const label = claim.claimId || "(no claimId)";

    if (!claim.claimId?.trim()) {
      errors.push("a claim is missing claimId");
    } else {
      if (!CLAIM_ID_PATTERN.test(claim.claimId)) errors.push(`${label}: claimId must be lowercase kebab-case`);
      if (seen.has(claim.claimId)) errors.push(`duplicate claimId "${claim.claimId}"`);
      seen.add(claim.claimId);
    }

    if (!claim.statement?.trim()) errors.push(`${label}: statement is required`);
    if (!claim.locator?.trim()) errors.push(`${label}: locator is required`);

    if (!claim.sources || claim.sources.length === 0) {
      errors.push(`${label}: requires at least one source`);
    } else {
      for (const source of claim.sources) {
        const sourceLabel = source.sourceId || "(no sourceId)";
        if (!source.sourceId?.trim()) errors.push(`${label}: a source is missing sourceId`);
        if (!source.publisher?.trim()) errors.push(`${label}: source "${sourceLabel}" is missing publisher`);
        if (!source.accessedAt?.trim() || !isValidDate(source.accessedAt)) {
          errors.push(`${label}: source "${sourceLabel}" has an invalid or missing accessedAt`);
        }
      }
    }

    if (claim.semanticReview?.status !== "reviewed" && claim.semanticReview?.status !== "unreviewed") {
      errors.push(`${label}: invalid semanticReview.status "${claim.semanticReview?.status}"`);
    } else if (claim.semanticReview.status === "reviewed") {
      if (!claim.semanticReview.reviewer?.trim()) errors.push(`${label}: a reviewed claim requires a named reviewer`);
      if (!claim.semanticReview.reviewedAt || !isValidDate(claim.semanticReview.reviewedAt)) {
        errors.push(`${label}: a reviewed claim requires a valid reviewedAt`);
      }
    }
  }

  return errors;
}

/** Scans every prose string in an article's sections for [[claim:ID]]
 * markers and flags any ID that isn't a real entry in `claims`. This is
 * the mechanism that prevents an automated citation-reachability result
 * from being mistaken for semantic proof: a marker only resolves if a
 * human-reviewable ledger entry actually exists for it. */
export function validateClaimReferences(sections: UniversalSections, claims: ArticleClaim[]): string[] {
  const errors: string[] = [];
  const knownIds = new Set(claims.map((c) => c.claimId));

  const scan = (field: string, text: string) => {
    for (const match of text.matchAll(CLAIM_MARKER_PATTERN)) {
      const id = match[1];
      if (!knownIds.has(id)) errors.push(`${field} references unknown claim "[[claim:${id}]]" — no matching entry in claims`);
    }
  };

  for (const [field, value] of Object.entries(sections)) {
    if (Array.isArray(value)) {
      value.forEach((entry, i) => {
        if (typeof entry === "string") scan(`${field}[${i}]`, entry);
      });
    } else if (typeof value === "string") {
      scan(field, value);
    }
  }

  return errors;
}

/** Convenience wrapper combining both checks for one article. */
export function validateArticleClaims(sections: UniversalSections, claims: ArticleClaim[] | undefined): string[] {
  const list = claims ?? [];
  return [...validateClaimLedger(list), ...validateClaimReferences(sections, list)];
}
