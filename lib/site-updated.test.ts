import { test } from "node:test";
import assert from "node:assert/strict";
import { latestSiteUpdate, utcToday } from "./site-updated.ts";
import { articles } from "./content.ts";
import { publishedKnowledgeArticles, knowledgeArticles } from "./knowledge-content.ts";
import { buildLog, type BuildLogEntry } from "./build-log.ts";
import { formatDisplayDate, type IsoDate } from "./content-dates.ts";

const guide = (publishedAt: IsoDate, lastReviewedAt: IsoDate = publishedAt) => ({ publishedAt, lastReviewedAt });
const knowledge = (status: string, dates: { publishedAt?: IsoDate; updatedAt?: IsoDate; lastReviewedAt?: IsoDate }) => ({ meta: { status, ...dates } });
const log = (date: BuildLogEntry["date"], type: BuildLogEntry["type"] = "publication"): BuildLogEntry => ({ date, type, title: "t" });
const base = { guides: [], publishedKnowledge: [], buildLog: [], today: "2026-12-31" as IsoDate };

test("picks the latest date across guides, knowledge, and build log", () => {
  const r = latestSiteUpdate({
    ...base,
    guides: [guide("2026-08-28")],
    publishedKnowledge: [knowledge("published", { publishedAt: "2026-09-01", lastReviewedAt: "2026-09-04" })],
    buildLog: [log({ precision: "day", value: "2026-09-02" })],
  });
  assert.deepEqual(r, { date: "2026-09-04", source: "knowledge" });
});

test("a later recorded build-log event wins over content dates", () => {
  const r = latestSiteUpdate({ ...base, guides: [guide("2026-08-28")], buildLog: [log({ precision: "day", value: "2026-09-10" })] });
  assert.deepEqual(r, { date: "2026-09-10", source: "build-log" });
});

test("guide lastReviewedAt and knowledge updatedAt count as updates", () => {
  assert.equal(latestSiteUpdate({ ...base, guides: [guide("2026-08-01", "2026-08-20")] })?.date, "2026-08-20");
  assert.equal(latestSiteUpdate({ ...base, publishedKnowledge: [knowledge("published", { publishedAt: "2026-08-01", updatedAt: "2026-08-15" })] })?.date, "2026-08-15");
});

test("drafts, non-published statuses, plans and year-only entries are excluded", () => {
  const r = latestSiteUpdate({
    ...base,
    guides: [guide("2026-08-01")],
    publishedKnowledge: [
      knowledge("drafting", { publishedAt: "2026-11-01" }),
      knowledge("ready", { lastReviewedAt: "2026-11-02" }),
    ],
    buildLog: [log({ precision: "year", value: 2026 }, "plan"), log({ precision: "day", value: "2026-11-03" }, "plan")],
  });
  assert.deepEqual(r, { date: "2026-08-01", source: "guide" });
});

test("future dates (after the build date) are ignored", () => {
  const r = latestSiteUpdate({ ...base, today: "2026-09-10", guides: [guide("2026-09-01")], buildLog: [log({ precision: "day", value: "2026-09-11" })] });
  assert.equal(r?.date, "2026-09-01");
  assert.equal(latestSiteUpdate({ ...base, today: "2026-09-10", guides: [guide("2026-09-10")] })?.date, "2026-09-10", "today itself counts");
});

test("missing or malformed dates are skipped; empty input yields no value", () => {
  assert.equal(latestSiteUpdate(base), undefined);
  const r = latestSiteUpdate({
    ...base,
    publishedKnowledge: [knowledge("published", { publishedAt: "Sep 9, 2026" as IsoDate }), knowledge("published", {})],
    guides: [guide("2026-08-18")],
  });
  assert.equal(r?.date, "2026-08-18");
});

test("real site data resolves to the latest published date and ignores drafts", () => {
  const r = latestSiteUpdate({ guides: articles, publishedKnowledge: publishedKnowledgeArticles, buildLog, today: "2026-09-23" });
  assert.ok(r);
  const drafts = knowledgeArticles.filter((a) => a.meta.status !== "published");
  // Recompute independently over the same published sources.
  const all = [
    ...articles.flatMap((a) => [a.publishedAt, a.lastReviewedAt]),
    ...publishedKnowledgeArticles.flatMap((a) => [a.meta.publishedAt, a.meta.updatedAt, a.meta.lastReviewedAt]),
    ...buildLog.flatMap((e) => (e.type !== "plan" && e.date.precision === "day" ? [e.date.value] : [])),
  ].filter((d): d is IsoDate => Boolean(d) && d! <= "2026-09-23");
  assert.equal(r.date, all.sort().at(-1));
  assert.equal(formatDisplayDate(r.date), "Sep 6, 2026", "baseline documented in s41.20.13");
  assert.ok(drafts.length > 0, "fixture sanity: drafts exist and are excluded by publishedKnowledgeArticles");
});

test("utcToday is a canonical UTC date", () => {
  assert.equal(utcToday(new Date("2026-09-23T23:59:59-04:00")), "2026-09-24");
  assert.equal(utcToday(new Date("2026-09-23T00:00:00Z")), "2026-09-23");
});
