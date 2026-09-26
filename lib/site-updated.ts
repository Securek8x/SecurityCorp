// Homepage "Updated" value (s41.20.13): the latest applicable date across
// public content, derived at build time — never hard-coded.
//
// Applicable: published guides (publishedAt, lastReviewedAt), published
// knowledge articles (publishedAt, updatedAt, lastReviewedAt), and dated
// build-log events. Excluded: drafts and every non-published knowledge status
// (callers pass publishedKnowledgeArticles), build-log plans and
// year-only dates (no day to compare), and any date after `today`.
//
// Only relative imports — scripts under plain `node` may import this module.
import type { BuildLogEntry } from "./build-log.ts";
import { compareIsoDates, isIsoDate, type IsoDate } from "./content-dates.ts";

export type FreshnessSource = "guide" | "knowledge" | "build-log";
export type SiteUpdated = Readonly<{ date: IsoDate; source: FreshnessSource }>;

type GuideDates = { publishedAt: IsoDate; lastReviewedAt: IsoDate };
type KnowledgeDates = { meta: { status: string; publishedAt?: IsoDate; updatedAt?: IsoDate; lastReviewedAt?: IsoDate } };

export function latestSiteUpdate(input: {
  guides: readonly GuideDates[];
  publishedKnowledge: readonly KnowledgeDates[];
  buildLog: readonly BuildLogEntry[];
  /** Build date (UTC). Anything later is treated as future and ignored. */
  today: IsoDate;
}): SiteUpdated | undefined {
  const candidates: { date: IsoDate; source: FreshnessSource }[] = [];
  const add = (date: IsoDate | undefined, source: FreshnessSource) => {
    if (date !== undefined && isIsoDate(date) && compareIsoDates(date, input.today) <= 0) candidates.push({ date, source });
  };
  for (const g of input.guides) {
    add(g.publishedAt, "guide");
    add(g.lastReviewedAt, "guide");
  }
  for (const k of input.publishedKnowledge) {
    // Defensive: the caller's list is already published-only.
    if (k.meta.status !== "published") continue;
    add(k.meta.publishedAt, "knowledge");
    add(k.meta.updatedAt, "knowledge");
    add(k.meta.lastReviewedAt, "knowledge");
  }
  for (const e of input.buildLog) {
    if (e.type === "plan" || e.date.precision !== "day") continue;
    add(e.date.value, "build-log");
  }
  if (candidates.length === 0) return undefined;
  const latest = candidates.reduce((a, b) => (compareIsoDates(b.date, a.date) > 0 ? b : a));
  return Object.freeze({ date: latest.date, source: latest.source });
}

/** Today's date in UTC as a canonical IsoDate. */
export function utcToday(now: Date = new Date()): IsoDate {
  return now.toISOString().slice(0, 10) as IsoDate;
}
