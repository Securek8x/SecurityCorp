// Canonical content-date contract.
//
// Stored form: a calendar date as an ISO 8601 `YYYY-MM-DD` string (IsoDate),
// interpreted as UTC midnight. This is what guide `publishedAt`/
// `lastReviewedAt`, knowledge `publishedAt`/`lastReviewedAt`/`updatedAt`, and
// dated build-log entries store.
//
// Display form: produced only by `formatDisplayDate` (e.g. "Aug 28, 2026"),
// computed in UTC with a fixed month table so output never depends on the
// build machine's timezone or ICU locale data.
//
// Nothing here invents a date: parsing rejects anything that isn't a real
// calendar date, and callers decide what to do with a missing one.
// Only relative imports — scripts under plain `node` import this module.

export type IsoDate = `${number}-${number}-${number}`;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export function isIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== "string") return false;
  const m = ISO_DATE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

/** UTC-midnight Date for a canonical date. Throws on anything else. */
export function parseIsoDate(value: string): Date {
  if (!isIsoDate(value)) throw new Error(`"${value}" is not a canonical YYYY-MM-DD date`);
  const [y, mo, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d));
}

/** "2026-08-28" → "Aug 28, 2026" (UTC, locale-independent). */
export function formatDisplayDate(value: IsoDate): string {
  const d = parseIsoDate(value);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/** "2026-08-28" → "2026-08-28T00:00:00.000Z", for JSON-LD, RSS, sitemaps. */
export function toIsoTimestamp(value: IsoDate): string {
  return parseIsoDate(value).toISOString();
}

/** Ascending comparator; canonical dates sort lexically, but this also validates. */
export function compareIsoDates(a: IsoDate, b: IsoDate): number {
  return parseIsoDate(a).getTime() - parseIsoDate(b).getTime();
}

/**
 * Migration helper for the legacy guide display format ("Aug 28, 2026").
 * Strict: exact month abbreviation, real calendar day, four-digit year —
 * no `new Date(string)` guessing, which is timezone- and engine-dependent.
 */
export function normalizeLegacyDisplayDate(value: string): IsoDate {
  const m = /^([A-Z][a-z]{2}) (\d{1,2}), (\d{4})$/.exec(value.trim());
  const month = m ? MONTHS.indexOf(m[1] as (typeof MONTHS)[number]) : -1;
  if (!m || month < 0) throw new Error(`"${value}" is not a legacy "Mon D, YYYY" date`);
  const iso = `${m[3]}-${String(month + 1).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  if (!isIsoDate(iso)) throw new Error(`"${value}" is not a real calendar date`);
  return iso;
}
