import { test } from "node:test";
import assert from "node:assert/strict";
import {
  compareIsoDates,
  formatDisplayDate,
  isIsoDate,
  normalizeLegacyDisplayDate,
  parseIsoDate,
  toIsoTimestamp,
} from "./content-dates.ts";
import { articles } from "./content.ts";
import { knowledgeArticles } from "./knowledge-content.ts";
import { buildLog, formatBuildLogDate } from "./build-log.ts";

test("isIsoDate accepts only real YYYY-MM-DD calendar dates", () => {
  assert.ok(isIsoDate("2026-08-28"));
  assert.ok(isIsoDate("2028-02-29"));
  for (const bad of ["2026-02-29", "2026-13-01", "2026-8-28", "Aug 28, 2026", "2026-08-28T00:00:00Z", "", undefined, 20260828]) {
    assert.equal(isIsoDate(bad), false, String(bad));
  }
});

test("parseIsoDate is UTC midnight and rejects non-canonical input", () => {
  assert.equal(parseIsoDate("2026-08-28").toISOString(), "2026-08-28T00:00:00.000Z");
  assert.throws(() => parseIsoDate("Aug 28, 2026"));
});

test("display formatting is deterministic and matches the legacy guide format", () => {
  assert.equal(formatDisplayDate("2026-08-28"), "Aug 28, 2026");
  assert.equal(formatDisplayDate("2026-09-06"), "Sep 6, 2026");
  assert.equal(formatDisplayDate("2026-12-31"), "Dec 31, 2026");
  assert.equal(formatDisplayDate("2027-01-01"), "Jan 1, 2027");
});

test("machine timestamps don't depend on the local timezone", () => {
  assert.equal(toIsoTimestamp("2026-08-24"), "2026-08-24T00:00:00.000Z");
});

test("legacy display dates normalize strictly and round-trip", () => {
  for (const legacy of ["Aug 28, 2026", "Aug 24, 2026", "Aug 18, 2026", "Sep 6, 2026"]) {
    assert.equal(formatDisplayDate(normalizeLegacyDisplayDate(legacy)), legacy);
  }
  assert.equal(normalizeLegacyDisplayDate("Aug 28, 2026"), "2026-08-28");
  for (const bad of ["August 28, 2026", "Aug 32, 2026", "Feb 29, 2026", "2026", "28 Aug 2026"]) {
    assert.throws(() => normalizeLegacyDisplayDate(bad), bad);
  }
});

test("compareIsoDates orders ascending", () => {
  const sorted = (["2026-09-06", "2026-08-18", "2026-08-29"] as const).slice().sort(compareIsoDates);
  assert.deepEqual(sorted, ["2026-08-18", "2026-08-29", "2026-09-06"]);
});

test("legacy guides store canonical dates and preserve their historical values", () => {
  // The pre-migration display strings, verbatim — no date was changed.
  const expected: Record<string, string> = {
    "malware-gate-for-automated-downloads": "Aug 28, 2026",
    "vpn-bound-container-stack": "Aug 24, 2026",
    "reverse-proxy-home-lab": "Aug 18, 2026",
  };
  assert.equal(articles.length, Object.keys(expected).length);
  for (const a of articles) {
    assert.ok(isIsoDate(a.publishedAt) && isIsoDate(a.lastReviewedAt), a.slug);
    assert.equal(formatDisplayDate(a.publishedAt), expected[a.slug], a.slug);
    assert.equal(formatDisplayDate(a.lastReviewedAt), expected[a.slug], a.slug);
  }
});

test("every knowledge article date (draft or published) is canonical when present", () => {
  for (const a of knowledgeArticles) {
    for (const field of ["publishedAt", "updatedAt", "lastReviewedAt"] as const) {
      const value = a.meta[field];
      if (value !== undefined) assert.ok(isIsoDate(value), `${a.meta.slug}.${field} = ${value}`);
    }
  }
});

test("build-log dates are canonical days or explicit years, never invented days", () => {
  for (const e of buildLog) {
    if (e.date.precision === "day") assert.ok(isIsoDate(e.date.value), e.title);
    else assert.equal(e.type, "plan", `${e.title}: only plans may be year-only`);
  }
  assert.deepEqual(buildLog.map((e) => formatBuildLogDate(e.date)), ["Aug 28, 2026", "Aug 24, 2026", "Aug 18, 2026", "2026"]);
});
