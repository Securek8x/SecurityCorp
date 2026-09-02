import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeReviewDue,
  getFreshnessStatus,
  validateFreshness,
  getFreshnessReviewQueue,
  type FreshnessMeta,
} from "./content-freshness.ts";

function freshness(overrides: Partial<FreshnessMeta> = {}): FreshnessMeta {
  return { contentVolatility: "medium", ...overrides };
}

const NOW = new Date("2026-09-02T00:00:00Z");

test("computeReviewDue derives from lastReviewedAt plus the volatility interval", () => {
  const due = computeReviewDue(freshness({ contentVolatility: "high" }), "2026-06-01", undefined);
  assert.equal(due, "2026-08-30"); // 2026-06-01 + 90 days
});

test("computeReviewDue falls back to publishedAt when never technically reviewed", () => {
  const due = computeReviewDue(freshness({ contentVolatility: "low" }), undefined, "2026-01-01");
  assert.equal(due, "2027-01-01"); // 2026-01-01 + 365 days
});

test("computeReviewDue prefers an explicit override over either date", () => {
  const due = computeReviewDue(freshness({ reviewDue: "2030-01-01" }), "2026-06-01", "2026-01-01");
  assert.equal(due, "2030-01-01");
});

test("computeReviewDue returns undefined with no basis date at all", () => {
  assert.equal(computeReviewDue(freshness(), undefined, undefined), undefined);
});

test("getFreshnessStatus is fresh well before the due date", () => {
  assert.equal(getFreshnessStatus(freshness(), "2027-01-01", NOW), "fresh");
});

test("getFreshnessStatus is due-soon inside the 30-day window", () => {
  assert.equal(getFreshnessStatus(freshness(), "2026-09-20", NOW), "due-soon");
});

test("getFreshnessStatus is due-soon exactly on the due date", () => {
  assert.equal(getFreshnessStatus(freshness(), "2026-09-02", NOW), "due-soon");
});

test("getFreshnessStatus is stale just past the due date", () => {
  assert.equal(getFreshnessStatus(freshness({ contentVolatility: "high" }), "2026-08-01", NOW), "stale");
});

test("getFreshnessStatus is overdue past double the interval", () => {
  // high volatility = 90-day interval; 200+ days overdue is well past 2x
  assert.equal(getFreshnessStatus(freshness({ contentVolatility: "high" }), "2026-01-01", NOW), "overdue");
});

test("getFreshnessStatus with no reviewDue at all is fresh (no signal to manufacture urgency from)", () => {
  assert.equal(getFreshnessStatus(freshness(), undefined, NOW), "fresh");
});

test("validateFreshness accepts a well-formed low-volatility article", () => {
  const errors = validateFreshness(freshness({ contentVolatility: "low" }), "2026-08-01", "2026-01-01", "published", NOW);
  assert.deepEqual(errors, []);
});

test("validateFreshness flags an invalid contentVolatility", () => {
  const errors = validateFreshness(
    freshness({ contentVolatility: "extreme" as unknown as "high" }),
    "2026-08-01",
    undefined,
    "drafting",
    NOW,
  );
  assert.ok(errors.some((e) => e.includes("invalid contentVolatility")));
});

test("validateFreshness flags an invalid explicit reviewDue", () => {
  const errors = validateFreshness(freshness({ reviewDue: "not-a-date" }), undefined, "2026-01-01", "drafting", NOW);
  assert.ok(errors.some((e) => e.includes("reviewDue") && e.includes("not a valid date")));
});

test("validateFreshness flags a private IP leaking through appliesTo", () => {
  const errors = validateFreshness(
    freshness({ appliesTo: ["internal service at 10.0.5.12"] }),
    "2026-08-01",
    undefined,
    "drafting",
    NOW,
  );
  assert.ok(errors.some((e) => e.includes("appliesTo")));
});

test("validateFreshness flags a private IP leaking through testedWith", () => {
  const errors = validateFreshness(
    freshness({ testedWith: ["ran against 192.168.1.50"] }),
    "2026-08-01",
    undefined,
    "drafting",
    NOW,
  );
  assert.ok(errors.some((e) => e.includes("testedWith")));
});

test("validateFreshness accepts a clean public version string in appliesTo/testedWith", () => {
  const errors = validateFreshness(
    freshness({ appliesTo: ["Kubernetes 1.30+"], testedWith: ["kubectl 1.30.3"] }),
    "2026-08-01",
    undefined,
    "drafting",
    NOW,
  );
  assert.deepEqual(errors, []);
});

test("validateFreshness requires a staleException once published content is severely overdue", () => {
  const errors = validateFreshness(freshness({ contentVolatility: "high" }), "2025-06-01", undefined, "published", NOW);
  assert.ok(errors.some((e) => e.includes("severely overdue") && e.includes("staleException")));
});

test("validateFreshness accepts severely overdue published content with a complete staleException", () => {
  const errors = validateFreshness(
    freshness({
      contentVolatility: "high",
      staleException: { reason: "Fundamentals unchanged; re-review scheduled", approvedBy: "Ravi Teja Thota", approvedAt: "2026-09-01" },
    }),
    "2025-06-01",
    undefined,
    "published",
    NOW,
  );
  assert.deepEqual(errors, []);
});

test("validateFreshness rejects an incomplete staleException", () => {
  const errors = validateFreshness(
    freshness({ contentVolatility: "high", staleException: { reason: "", approvedBy: "", approvedAt: "not-a-date" } }),
    "2025-06-01",
    undefined,
    "published",
    NOW,
  );
  assert.ok(errors.some((e) => e.includes("requires a reason")));
  assert.ok(errors.some((e) => e.includes("requires an approvedBy")));
  assert.ok(errors.some((e) => e.includes("requires a valid approvedAt")));
});

test("validateFreshness does not require a staleException for severely overdue non-published (drafting) content", () => {
  const errors = validateFreshness(freshness({ contentVolatility: "high" }), "2025-06-01", undefined, "drafting", NOW);
  assert.deepEqual(errors, []);
});

test("getFreshnessReviewQueue omits articles with no freshness metadata", () => {
  const queue = getFreshnessReviewQueue([{ meta: { slug: "a", title: "A" } }], NOW);
  assert.deepEqual(queue, []);
});

test("getFreshnessReviewQueue omits fresh articles and orders the rest by urgency", () => {
  const queue = getFreshnessReviewQueue(
    [
      { meta: { slug: "fresh-one", title: "Fresh", publishedAt: "2026-08-01" }, freshness: freshness({ contentVolatility: "low" }) },
      {
        meta: { slug: "overdue-one", title: "Overdue", publishedAt: "2025-06-01" },
        freshness: freshness({ contentVolatility: "high" }),
      },
      {
        meta: { slug: "due-soon-one", title: "Due Soon", publishedAt: "2026-06-04" },
        freshness: freshness({ contentVolatility: "high" }),
      },
    ],
    NOW,
  );
  assert.deepEqual(
    queue.map((e) => e.slug),
    ["overdue-one", "due-soon-one"],
  );
  assert.equal(queue[0].status, "overdue");
  assert.equal(queue[1].status, "due-soon");
});
