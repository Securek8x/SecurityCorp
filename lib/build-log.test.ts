import { test } from "node:test";
import assert from "node:assert/strict";
import { BUILD_LOG_EVENT_TYPES, buildLog, buildLogEventLabel, resolveBuildLog } from "./build-log.ts";
import { articles } from "./content.ts";
import { EVIDENCE_MATURITIES, evidenceMaturityLabel } from "./evidence.ts";

test("event types are their own vocabulary, disjoint from evidence maturity", () => {
  const maturityWords = new Set([...EVIDENCE_MATURITIES, ...Object.values(evidenceMaturityLabel)].map((w) => w.toLowerCase()));
  for (const t of BUILD_LOG_EVENT_TYPES) {
    assert.equal(maturityWords.has(t), false, t);
    assert.equal(maturityWords.has(buildLogEventLabel[t].toLowerCase()), false, t);
  }
});

test("publication events come from the guide record: same date, title, and route", () => {
  const pubs = buildLog.filter((e) => e.type === "publication");
  assert.equal(pubs.length, 3);
  for (const e of pubs) {
    const guide = articles.find((a) => e.href === `/guides/${a.slug}`);
    assert.ok(guide, e.title);
    assert.deepEqual(e.date, { precision: "day", value: guide.publishedAt });
    assert.equal(e.title, `Published “${guide.title}”`);
  }
});

test("only recorded, dated events are day-precise; the plan keeps its year and invents no day", () => {
  const plans = buildLog.filter((e) => e.type === "plan");
  assert.deepEqual(plans.map((p) => p.date), [{ precision: "year", value: 2026 }]);
});

test("entries are in reverse chronological order", () => {
  const days = buildLog.filter((e) => e.date.precision === "day").map((e) => (e.date.precision === "day" ? e.date.value : ""));
  assert.deepEqual(days, [...days].sort().reverse());
});

test("an unknown guide slug fails the build instead of rendering an invented event", () => {
  assert.throws(() => resolveBuildLog([{ type: "publication", guideSlug: "no-such-guide" }]), /unknown guide/);
});
