// Content freshness and applicability metadata (Bead securitycorp-source-9vn).
// Security content ages unevenly — a TLS-fundamentals article and a
// CVE-driven article do not share a sane review cadence — so the review
// interval is driven by a per-article `contentVolatility` rather than one
// universal number. Optional and additive, same rationale as lib/claim-
// ledger.ts: absent on every article in this catalog today; new/updated
// articles should populate it going forward. Retrofitting the existing
// 24-article catalog is a separate, much larger content-editing effort,
// deliberately out of this bead's engineering scope.
//
// `lastReviewedAt`/`updatedAt` already exist on KnowledgeArticleMeta
// (lib/knowledge-schema.ts) and keep their existing meaning: updatedAt is
// an editorial content change, lastReviewedAt is a technical revalidation
// pass. reviewDue below is always derived from lastReviewedAt (falling
// back to publishedAt if the article has never been technically
// re-reviewed) unless explicitly overridden — an editorial-only update
// must never silently reset the freshness clock.
import { scanTextForLeaks } from "./privacy-leak-gate.ts";

export const CONTENT_VOLATILITY = ["low", "medium", "high"] as const;
export type ContentVolatility = (typeof CONTENT_VOLATILITY)[number];

/** Default review-interval policy by volatility, in days. A fast-moving or
 * CVE-driven topic (high) needs far more frequent revalidation than a
 * fundamentals article (low). */
export const REVIEW_INTERVAL_DAYS: Record<ContentVolatility, number> = {
  low: 365,
  medium: 180,
  high: 90,
};

const DUE_SOON_WINDOW_DAYS = 30;
/** Overdue by more than this multiple of the article's own interval counts
 * as "severely overdue" — see validateFreshness below. */
const SEVERE_OVERDUE_MULTIPLIER = 2;

export type StaleException = {
  reason: string;
  approvedBy: string;
  approvedAt: string;
};

export type FreshnessMeta = {
  contentVolatility: ContentVolatility;
  /** Explicit override. If unset, computed from lastReviewedAt/publishedAt
   * plus the volatility interval. */
  reviewDue?: string;
  /** Versions/environments/technologies the content is written against,
   * e.g. "Kubernetes 1.30+". Never a private hostname, internal IP, or
   * credential — scanned by validateFreshness below. */
  appliesTo?: string[];
  /** Specific tool/version combinations actually exercised while
   * validating the content, e.g. "kubectl 1.30.3". Same leak-scan
   * constraint as appliesTo. */
  testedWith?: string[];
  /** Required once content is severely overdue and still `status:
   * "published"` — an explicit human decision to keep it current rather
   * than silent staleness. */
  staleException?: StaleException;
};

export type FreshnessStatus = "fresh" | "due-soon" | "stale" | "overdue";

function isValidDate(value: string | undefined): boolean {
  if (value === undefined) return true;
  return !Number.isNaN(new Date(value).getTime());
}

/** Always derives from lastReviewedAt (falling back to publishedAt) plus
 * the volatility interval, unless `reviewDue` is explicitly set. */
export function computeReviewDue(
  freshness: FreshnessMeta,
  lastReviewedAt: string | undefined,
  publishedAt: string | undefined,
): string | undefined {
  if (freshness.reviewDue) return freshness.reviewDue;
  const base = lastReviewedAt ?? publishedAt;
  if (!base || !isValidDate(base)) return undefined;
  const interval = REVIEW_INTERVAL_DAYS[freshness.contentVolatility];
  if (interval === undefined) return undefined; // invalid contentVolatility — validateFreshness reports this separately
  const due = new Date(base);
  due.setUTCDate(due.getUTCDate() + interval);
  return due.toISOString().slice(0, 10);
}

export function getFreshnessStatus(
  freshness: FreshnessMeta,
  reviewDue: string | undefined,
  now: Date = new Date(),
): FreshnessStatus {
  if (!reviewDue || !isValidDate(reviewDue)) return "fresh";
  const daysUntilDue = Math.floor((new Date(reviewDue).getTime() - now.getTime()) / 86_400_000);
  if (daysUntilDue > DUE_SOON_WINDOW_DAYS) return "fresh";
  if (daysUntilDue >= 0) return "due-soon";
  const interval = REVIEW_INTERVAL_DAYS[freshness.contentVolatility];
  return -daysUntilDue > interval * SEVERE_OVERDUE_MULTIPLIER ? "overdue" : "stale";
}

/** Validates one article's freshness metadata. Takes the article's own
 * lastReviewedAt/publishedAt/status as separate arguments rather than
 * importing KnowledgeArticleMeta, to avoid a circular dependency with
 * knowledge-schema.ts (same pattern as lib/claim-ledger.ts). */
export function validateFreshness(
  freshness: FreshnessMeta,
  lastReviewedAt: string | undefined,
  publishedAt: string | undefined,
  articleStatus: string,
  now: Date = new Date(),
): string[] {
  const errors: string[] = [];

  if (!CONTENT_VOLATILITY.includes(freshness.contentVolatility)) {
    errors.push(`invalid contentVolatility "${freshness.contentVolatility}"`);
  }
  if (!isValidDate(freshness.reviewDue)) errors.push(`reviewDue "${freshness.reviewDue}" is not a valid date`);

  for (const [field, values] of [
    ["appliesTo", freshness.appliesTo],
    ["testedWith", freshness.testedWith],
  ] as const) {
    for (const value of values ?? []) {
      for (const finding of scanTextForLeaks(value, field)) {
        errors.push(`${field} "${value}": possible ${finding.rule} ("${finding.match}")`);
      }
    }
  }

  if (freshness.staleException) {
    const exc = freshness.staleException;
    if (!exc.reason?.trim()) errors.push("staleException requires a reason");
    if (!exc.approvedBy?.trim()) errors.push("staleException requires an approvedBy");
    if (!exc.approvedAt || !isValidDate(exc.approvedAt)) errors.push("staleException requires a valid approvedAt");
  }

  const reviewDue = computeReviewDue(freshness, lastReviewedAt, publishedAt);
  const status = getFreshnessStatus(freshness, reviewDue, now);
  if (status === "overdue" && articleStatus === "published" && !freshness.staleException) {
    errors.push("published content is severely overdue for review and has no staleException recorded");
  }

  return errors;
}

export type ReviewQueueEntry = {
  slug: string;
  title: string;
  status: FreshnessStatus;
  reviewDue: string | undefined;
};

type QueueableArticle = {
  meta: { slug: string; title: string; publishedAt?: string; lastReviewedAt?: string };
  freshness?: FreshnessMeta;
};

/** Produces a review queue of articles approaching or past their review due
 * date, most urgent first. Only includes articles that define `freshness`
 * — omitting it is not itself flagged here; retrofitting the existing
 * catalog is a separate decision (see the module header). */
export function getFreshnessReviewQueue(articles: QueueableArticle[], now: Date = new Date()): ReviewQueueEntry[] {
  const entries: ReviewQueueEntry[] = [];
  for (const article of articles) {
    if (!article.freshness) continue;
    const reviewDue = computeReviewDue(article.freshness, article.meta.lastReviewedAt, article.meta.publishedAt);
    const status = getFreshnessStatus(article.freshness, reviewDue, now);
    if (status === "fresh") continue;
    entries.push({ slug: article.meta.slug, title: article.meta.title, status, reviewDue });
  }
  const rank: Record<FreshnessStatus, number> = { overdue: 0, stale: 1, "due-soon": 2, fresh: 3 };
  return entries.sort((a, b) => rank[a.status] - rank[b.status] || (a.reviewDue ?? "").localeCompare(b.reviewDue ?? ""));
}
